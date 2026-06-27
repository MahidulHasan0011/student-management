import { withTransaction } from '../config/db.js';
import { sectionService } from '../modules/sections/section.service.js';
import { rankingLockRepository } from '../modules/ranking-locks/ranking-lock.repository.js';
import { rankingRepository } from '../modules/ranking/ranking.repository.js';
import { AppError } from '../utils/appError.js';

// ── Core business logic — rank অনুযায়ী roll_number + section বসায়, একই transaction-এ
//    history snapshot সংরক্ষণ করে এবং ranking lock করে দেয় ──
//
// পুরো কাজটা একটাই DB transaction-এ হয় → roll, history, lock তিনটার যেকোনো একটা ব্যর্থ হলে
// সবগুলো rollback হবে (atomicity)। শুরুতেই Postgres advisory lock নেওয়া হয়, তাই একই class+session-এর
// দুটো job কখনো একসাথে চলতে পারবে না (concurrency safety) — দ্বিতীয়টা প্রথমটার commit পর্যন্ত অপেক্ষা করবে।
export const rollEngine = {
  // rankedList = [{ student_id, rank_position, total_score }, ...] — ranking.engine থেকে আসে
  // lockedBy: যে admin/system trigger করেছে তার user id — lock + audit-এ যাবে
  async generateRolls({
    rankedList,
    classId,
    academicSessionId,
    sectionId = null,
    lockedBy = null,
  }) {
    if (!rankedList.length) {
      throw new AppError('Ranked list is empty — nothing to assign', 400);
    }

    return withTransaction(async (client) => {
      // ── ১. concurrency guard — একই class+session-এ একসাথে দুটো ranking job চলতে দেবে না ──
      // hashtext দিয়ে class+session-কে একটা int key-তে এনে session-scoped advisory lock নেওয়া হয়;
      // transaction commit/rollback হলে lock নিজে থেকেই ছেড়ে যায় (xact-scoped)
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [
        `ranking:${classId}:${academicSessionId}`,
      ]);

      // ── ২. roll_number + section বসানো ──
      let results;
      if (sectionId) {
        results = await this._assignDirectRoll(client, rankedList, academicSessionId, sectionId);
      } else {
        const sections = await sectionService.getSectionsForDistribution(classId);
        results = !sections.length
          ? await this._assignDirectRoll(client, rankedList, academicSessionId, null)
          : await this._assignWithSectionDistribution(
              client,
              rankedList,
              academicSessionId,
              sections,
            );
      }

      // ── ৩. history snapshot সংরক্ষণ (version = আগের MAX + 1) ──
      const version = await this._saveHistory(
        client,
        rankedList,
        results,
        classId,
        academicSessionId,
      );

      // ── ৪. ranking lock (document rule: "After rank generation: ranking_locked = true") ──
      await rankingLockRepository.lock(classId, academicSessionId, lockedBy, client);

      // ── ৫. audit trail ──
      await rankingRepository.logAudit(
        {
          action: 'GENERATE',
          classId,
          academicSessionId,
          actorId: lockedBy,
          toVersion: version,
          detail: { rankedCount: results.length },
        },
        client,
      );

      return { results, version };
    });
  },

  // section ছাড়া বা single section-এ সরাসরি rank=roll বসানো
  async _assignDirectRoll(client, rankedList, academicSessionId, sectionId) {
    const results = [];
    for (const entry of rankedList) {
      const { rows } = await client.query(
        `UPDATE student_enrollments
         SET roll_number = $1, section_id = COALESCE($2, section_id), updated_at = NOW()
         WHERE student_id = $3 AND academic_session_id = $4 AND deleted_at IS NULL
         RETURNING id, student_id, roll_number, section_id`,
        [entry.rank_position, sectionId, entry.student_id, academicSessionId],
      );
      if (rows[0]) results.push(rows[0]);
    }
    return results;
  },

  // Section A পূর্ণ হলে B, তারপর C — capacity অনুযায়ী ক্রমান্বয়ে ভরে যায়
  // প্রতিটা section-এর ভেতরে roll_number আলাদাভাবে ১ থেকে শুরু হয়
  async _assignWithSectionDistribution(client, rankedList, academicSessionId, sections) {
    const results = [];
    let sectionIdx = 0;
    let rollInSection = 1;
    let remainingInSection = sections[sectionIdx].available_seats ?? Infinity;

    for (const entry of rankedList) {
      // চলতি section ভরে গেলে পরের section-এ যাও
      while (remainingInSection <= 0 && sectionIdx < sections.length - 1) {
        sectionIdx++;
        rollInSection = 1;
        remainingInSection = sections[sectionIdx].available_seats ?? Infinity;
      }

      const currentSection = sections[sectionIdx];

      const { rows } = await client.query(
        `UPDATE student_enrollments
         SET roll_number = $1, section_id = $2, updated_at = NOW()
         WHERE student_id = $3 AND academic_session_id = $4 AND deleted_at IS NULL
         RETURNING id, student_id, roll_number, section_id`,
        [rollInSection, currentSection.id, entry.student_id, academicSessionId],
      );
      if (rows[0]) results.push(rows[0]);

      rollInSection++;
      remainingInSection--;
    }

    return results;
  },

  // ── prev MAX(version)+1 বের করে পুরো ranked list bulk-insert করে ──
  // total_score আসে rankedList থেকে (merit list/ADMISSION → আসল score, FIFO student → 0),
  // roll_number আসে আসল assignment result থেকে (section-wise হলে rank ≠ roll)
  async _saveHistory(client, rankedList, results, classId, academicSessionId) {
    const { rows: vrows } = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next
       FROM ranking_history
       WHERE class_id = $1 AND academic_session_id = $2`,
      [classId, academicSessionId],
    );
    const version = vrows[0].next;

    // student_id → assigned roll_number map (section distribution-এ roll আলাদা)
    const rollByStudent = new Map(results.map((r) => [r.student_id, r.roll_number]));

    const placeholders = [];
    const params = [];
    let i = 0;
    for (const entry of rankedList) {
      const rollNumber = rollByStudent.get(entry.student_id);
      if (rollNumber == null) continue; // enrollment আপডেট হয়নি (যেমন withdrawn) — snapshot-এ আনব না

      const b = i * 7;
      placeholders.push(
        `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7})`,
      );
      params.push(
        academicSessionId,
        classId,
        entry.student_id,
        Number(entry.total_score) || 0,
        entry.rank_position,
        rollNumber,
        version,
      );
      i++;
    }

    if (placeholders.length) {
      await client.query(
        `INSERT INTO ranking_history
           (academic_session_id, class_id, student_id, total_score, rank_position, roll_number, version)
         VALUES ${placeholders.join(', ')}`,
        params,
      );
    }

    return version;
  },
};
