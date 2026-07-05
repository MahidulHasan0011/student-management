import { query } from '../../config/db.js';

export const rankingLockRepository = {
  // whether a lock status exists for the class+session — if not, it's assumed unlocked (first time)
  async findByClassAndSession(classId, academicSessionId) {
    const { rows } = await query(
      `SELECT * FROM ranking_locks
       WHERE class_id = $1 AND academic_session_id = $2`,
      [classId, academicSessionId],
    );
    return rows[0] || null;
  },

  async isLocked(classId, academicSessionId) {
    const lock = await this.findByClassAndSession(classId, academicSessionId);
    return lock?.is_locked === true;
  },

  // creates and locks the row if no lock row exists, updates it if it does — upsert pattern
  // if a client is passed it becomes part of the roll.engine's ongoing transaction (roll+history+lock atomic)
  async lock(classId, academicSessionId, lockedBy, client = null) {
    const exec = client ? client.query.bind(client) : query;
    const { rows } = await exec(
      `INSERT INTO ranking_locks (class_id, academic_session_id, is_locked, locked_at, locked_by)
       VALUES ($1, $2, true, NOW(), $3)
       ON CONFLICT (class_id, academic_session_id)
       DO UPDATE SET is_locked = true, locked_at = NOW(), locked_by = $3, updated_at = NOW()
       RETURNING *`,
      [classId, academicSessionId, lockedBy || null],
    );
    return rows[0];
  },

  async unlock(classId, academicSessionId, client = null) {
    const exec = client ? client.query.bind(client) : query;
    const { rows } = await exec(
      `INSERT INTO ranking_locks (class_id, academic_session_id, is_locked, locked_at, locked_by)
       VALUES ($1, $2, false, NULL, NULL)
       ON CONFLICT (class_id, academic_session_id)
       DO UPDATE SET is_locked = false, locked_at = NULL, locked_by = NULL, updated_at = NOW()
       RETURNING *`,
      [classId, academicSessionId],
    );
    return rows[0];
  },
};
