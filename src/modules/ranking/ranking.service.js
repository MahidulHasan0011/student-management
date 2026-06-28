import { academicSessionRepository } from '../academic-sessions/academic-session.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { examRepository } from '../exams/exam.repository.js';
import { rankingLockRepository } from '../ranking-locks/ranking-lock.repository.js';
import { AppError } from '../../utils/appError.js';
import { enqueueRankingJob } from '../../queues/ranking.queue.js';
import { rankingRepository } from './ranking.repository.js';
import { cacheService } from '../../services/cache.service.js';
import { assertUuid } from '../../utils/validators.js';

const CURRENT_TTL = 60 * 60; // current ranking cache 1 ঘন্টা
const currentKey = (classId, sessionId) => `ranking:current:${classId}:${sessionId}`;

// class+session valid কিনা যাচাই করে দুটোই ফেরত দেয় (বারবার লাগে)
const loadClassAndSession = async (classId, academicSessionId) => {
  if (!classId || !academicSessionId) {
    throw new AppError('classId and academicSessionId are required', 400);
  }
  const cls = await classRepository.findById(classId);
  if (!cls) throw new AppError('Class not found', 404);
  const session = await academicSessionRepository.findById(academicSessionId);
  if (!session) throw new AppError('Academic session not found', 404);
  return { cls, session };
};

// FINAL (+ admission হলে ADMISSION) PUBLISHED কিনা যাচাই
// throwOnMissing=false হলে error throw না করে শুধু boolean ফেরত দেয় (auto-trigger-এর জন্য)
const checkResultsReady = async (
  classId,
  academicSessionId,
  admissionTestEnabled,
  throwOnMissing = true,
) => {
  const finalExam = await examRepository.findByClassSessionAndType(
    classId,
    academicSessionId,
    'FINAL',
  );
  if (!finalExam || finalExam.status !== 'PUBLISHED') {
    if (throwOnMissing) {
      throw new AppError('FINAL exam results must be published before generating ranking', 400);
    }
    return false;
  }

  if (admissionTestEnabled) {
    const admissionExam = await examRepository.findByClassSessionAndType(
      classId,
      academicSessionId,
      'ADMISSION',
    );
    if (!admissionExam || admissionExam.status !== 'PUBLISHED') {
      if (throwOnMissing) {
        throw new AppError(
          'ADMISSION exam results must be published before generating ranking',
          400,
        );
      }
      return false;
    }
  }
  return true;
};

export const rankingService = {
  // ── Manual "Generate Roll" বাটন (ধাপ: একবারই, locked থাকলে আটকাবে) ──
  async triggerRankingAndRoll({ classId, academicSessionId, sectionId, triggeredBy }) {
    classId = assertUuid(classId, 'classId');
    academicSessionId = assertUuid(academicSessionId, 'academicSessionId');
    sectionId = assertUuid(sectionId, 'sectionId', { required: false });
    triggeredBy = assertUuid(triggeredBy, 'triggeredBy', { required: false });

    const { session } = await loadClassAndSession(classId, academicSessionId);

    const locked = await rankingLockRepository.isLocked(classId, academicSessionId);
    if (locked) {
      throw new AppError(
        'Ranking is already locked for this class & session. Use the recalculate endpoint to regenerate.',
        409,
      );
    }

    await checkResultsReady(classId, academicSessionId, session.admission_test_enabled, true);

    const job = await enqueueRankingJob({
      classId,
      academicSessionId,
      sectionId: sectionId || null,
      admissionTestEnabled: session.admission_test_enabled,
      triggeredBy: triggeredBy || null,
    });

    return { jobId: job.id, status: 'queued' };
  },

  // ── Auto-trigger — exam publish হওয়ার পর exam.service থেকে কল হয় ──
  // কখনো throw করে না (publish flow ভাঙা যাবে না)। শর্ত পূরণ না হলে বা locked থাকলে চুপচাপ skip করে,
  // আর সেটাও audit log-এ রেখে দেয়। কেবল FINAL/ADMISSION publish-এই এটা ডাকা অর্থপূর্ণ।
  async autoTriggerAfterPublish({ classId, academicSessionId, examType }) {
    try {
      if (!classId || !academicSessionId) return;

      const session = await academicSessionRepository.findById(academicSessionId);
      if (!session) return;

      // locked থাকলে auto-recalculation নিষেধ (document rule) — skip + log
      if (await rankingLockRepository.isLocked(classId, academicSessionId)) {
        await rankingRepository.logAudit({
          action: 'AUTO_TRIGGER_SKIP',
          classId,
          academicSessionId,
          detail: { reason: 'locked', examType },
        });
        return;
      }

      const ready = await checkResultsReady(
        classId,
        academicSessionId,
        session.admission_test_enabled,
        false,
      );
      if (!ready) {
        await rankingRepository.logAudit({
          action: 'AUTO_TRIGGER_SKIP',
          classId,
          academicSessionId,
          detail: { reason: 'results_not_ready', examType },
        });
        return;
      }

      await enqueueRankingJob({
        classId,
        academicSessionId,
        sectionId: null,
        admissionTestEnabled: session.admission_test_enabled,
        triggeredBy: null, // system trigger
      });

      await rankingRepository.logAudit({
        action: 'AUTO_TRIGGER',
        classId,
        academicSessionId,
        detail: { examType },
      });
    } catch (err) {
      // auto path-এ কখনো throw করব না — শুধু log
      console.error('[ranking.autoTrigger] failed:', err.message);
    }
  },

  // ── RECALCULATE_RANKING (admin only) ──
  // ১. unlock → ২.৩.৪. job allowWhenLocked:true দিয়ে recalc+regenerate+history → ৫. job শেষে আবার lock
  async recalculate({ classId, academicSessionId, sectionId, triggeredBy }) {
    classId = assertUuid(classId, 'classId');
    academicSessionId = assertUuid(academicSessionId, 'academicSessionId');
    sectionId = assertUuid(sectionId, 'sectionId', { required: false });
    triggeredBy = assertUuid(triggeredBy, 'triggeredBy', { required: false });

    const { session } = await loadClassAndSession(classId, academicSessionId);

    await checkResultsReady(classId, academicSessionId, session.admission_test_enabled, true);

    const before = await rankingLockRepository.findByClassAndSession(classId, academicSessionId);
    const fromVersion =
      (await rankingRepository.getVersions(classId, academicSessionId))[0]?.version ?? null;

    // ধাপ ১ — explicit unlock
    await rankingLockRepository.unlock(classId, academicSessionId);
    await rankingRepository.logAudit({
      action: 'UNLOCK',
      classId,
      academicSessionId,
      actorId: triggeredBy || null,
      fromVersion,
      detail: { context: 'recalculate', wasLocked: before?.is_locked ?? false },
    });

    // ধাপ ২–৫ — background job (allowWhenLocked লাগবে না কারণ আমরা আগেই unlock করেছি,
    // তবু পাঠালাম যাতে job-চলাকালীন race-এ অন্য কেউ lock করে ফেললেও আটকে না যায়)
    const job = await enqueueRankingJob({
      classId,
      academicSessionId,
      sectionId: sectionId || null,
      admissionTestEnabled: session.admission_test_enabled,
      triggeredBy: triggeredBy || null,
      allowWhenLocked: true,
    });

    // stale cache সরিয়ে দাও — নতুন snapshot job শেষে roll.job আবার invalidate করবে
    await cacheService.del(currentKey(classId, academicSessionId));

    return { jobId: job.id, status: 'recalculating', fromVersion };
  },

  // ── শুধু unlock (regenerate ছাড়া) — admin ম্যানুয়ালি edit করতে চাইলে ──
  async unlock({ classId, academicSessionId, triggeredBy }) {
    classId = assertUuid(classId, 'classId');
    academicSessionId = assertUuid(academicSessionId, 'academicSessionId');
    triggeredBy = assertUuid(triggeredBy, 'triggeredBy', { required: false });

    await loadClassAndSession(classId, academicSessionId);
    const result = await rankingLockRepository.unlock(classId, academicSessionId);
    await rankingRepository.logAudit({
      action: 'UNLOCK',
      classId,
      academicSessionId,
      actorId: triggeredBy || null,
      detail: { context: 'manual_unlock' },
    });
    return result;
  },

  // ── Read: current ranking (cache-first) ──
  async getRanking(classId, academicSessionId) {
    classId = assertUuid(classId, 'classId');
    academicSessionId = assertUuid(academicSessionId, 'academicSessionId');

    await loadClassAndSession(classId, academicSessionId);

    const key = currentKey(classId, academicSessionId);
    const cached = await cacheService.get(key);
    if (cached) return cached;

    const data = await rankingRepository.getCurrentRanking(classId, academicSessionId);
    if (data.length) await cacheService.set(key, data, CURRENT_TTL);
    return data;
  },

  async getHistory(classId, academicSessionId, version) {
    classId = assertUuid(classId, 'classId');
    academicSessionId = assertUuid(academicSessionId, 'academicSessionId');

    await loadClassAndSession(classId, academicSessionId);
    const v = version != null && version !== '' ? Number(version) : null;
    const [snapshots, versions] = await Promise.all([
      rankingRepository.getHistory(classId, academicSessionId, v),
      rankingRepository.getVersions(classId, academicSessionId),
    ]);
    return { versions, snapshots };
  },

  async getAuditLog(classId, academicSessionId) {
    classId = assertUuid(classId, 'classId');
    academicSessionId = assertUuid(academicSessionId, 'academicSessionId');

    await loadClassAndSession(classId, academicSessionId);
    return rankingRepository.getAuditLog(classId, academicSessionId);
  },
};
