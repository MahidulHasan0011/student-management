import { withTransaction } from "../config/db.js";
import { sectionService } from "../modules/sections/section.service.js";
import { AppError } from "../utils/AppError.js";

// ── Core business logic — rank অনুযায়ী roll_number ও section_id বসায় ──
export const rollEngine = {
  // rankedList = [{ student_id, rank_position }, ...] — ranking.engine থেকে আসে
  // section না থাকলে সরাসরি roll বসিয়ে দেয়; section থাকলে capacity মেনে বিতরণ করে
  async generateRolls({ rankedList, classId, academicSessionId, sectionId = null }) {
    if (!rankedList.length) {
      throw new AppError("Ranked list is empty — nothing to assign", 400);
    }

    if (sectionId) {
      // single section নির্দিষ্ট থাকলে — সরাসরি rank = roll
      return this._assignDirectRoll(rankedList, classId, academicSessionId, sectionId);
    }

    // class-এ একাধিক section থাকলে capacity অনুযায়ী ভাগ করে assign করতে হবে
    const sections = await sectionService.getSectionsForDistribution(classId);

    if (!sections.length) {
      // section-ই নেই — সরাসরি class-এ roll বসাও
      return this._assignDirectRoll(rankedList, classId, academicSessionId, null);
    }

    return this._assignWithSectionDistribution(rankedList, classId, academicSessionId, sections);
  },

  // section ছাড়া বা single section-এ সরাসরি rank=roll বসানো
  async _assignDirectRoll(rankedList, classId, academicSessionId, sectionId) {
    return withTransaction(async (client) => {
      const results = [];
      for (const entry of rankedList) {
        const { rows } = await client.query(
          `UPDATE student_enrollments
           SET roll_number = $1, section_id = COALESCE($2, section_id), updated_at = NOW()
           WHERE student_id = $3 AND academic_session_id = $4 AND deleted_at IS NULL
           RETURNING id, student_id, roll_number, section_id`,
          [entry.rank_position, sectionId, entry.student_id, academicSessionId]
        );
        if (rows[0]) results.push(rows[0]);
      }
      return results;
    });
  },

  // Section A পূর্ণ হলে B, তারপর C — capacity অনুযায়ী ক্রমান্বয়ে ভরে যায়
  // প্রতিটা section-এর ভেতরে roll_number আলাদাভাবে ১ থেকে শুরু হয়
  async _assignWithSectionDistribution(rankedList, classId, academicSessionId, sections) {
    return withTransaction(async (client) => {
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
          [rollInSection, currentSection.id, entry.student_id, academicSessionId]
        );
        if (rows[0]) results.push(rows[0]);

        rollInSection++;
        remainingInSection--;
      }

      return results;
    });
  },
};