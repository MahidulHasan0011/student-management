import { query } from '../../config/db.js';

// ── Ranking module read queries + writing the audit log ──
// logAudit is called from inside the roll.engine transaction (by passing a client),
// and can also be called directly from the service (without a client → pool query)
export const rankingRepository = {
  // the latest version's snapshot for a class+session — this is the "current ranking"
  // (we read the authoritative history snapshot instead of live student_enrollments.roll_number,
  //  because rank_position + total_score are kept together here)
  async getCurrentRanking(classId, academicSessionId) {
    const { rows } = await query(
      `WITH latest AS (
         SELECT MAX(version) AS v
         FROM ranking_history
         WHERE class_id = $1 AND academic_session_id = $2
       )
       SELECT
         rh.student_id,
         s.student_code,
         u.full_name AS student_name,
         rh.total_score,
         rh.rank_position,
         rh.roll_number,
         rh.version,
         rh.generated_at
       FROM ranking_history rh
       JOIN latest l ON rh.version = l.v
       JOIN students s ON s.id = rh.student_id
       JOIN users u ON u.id = s.user_id
       WHERE rh.class_id = $1 AND rh.academic_session_id = $2
       ORDER BY rh.rank_position ASC`,
      [classId, academicSessionId],
    );
    return rows;
  },

  // snapshot for a specific version (or all versions if none given) — for the history viewer
  async getHistory(classId, academicSessionId, version = null) {
    const params = [classId, academicSessionId];
    let versionFilter = '';
    if (version != null) {
      params.push(version);
      versionFilter = `AND rh.version = $3`;
    }
    const { rows } = await query(
      `SELECT
         rh.student_id,
         s.student_code,
         u.full_name AS student_name,
         rh.total_score,
         rh.rank_position,
         rh.roll_number,
         rh.version,
         rh.generated_at
       FROM ranking_history rh
       JOIN students s ON s.id = rh.student_id
       JOIN users u ON u.id = s.user_id
       WHERE rh.class_id = $1 AND rh.academic_session_id = $2 ${versionFilter}
       ORDER BY rh.version DESC, rh.rank_position ASC`,
      params,
    );
    return rows;
  },

  // which versions exist — to build the history dropdown
  async getVersions(classId, academicSessionId) {
    const { rows } = await query(
      `SELECT version, MIN(generated_at) AS generated_at, COUNT(*) AS student_count
       FROM ranking_history
       WHERE class_id = $1 AND academic_session_id = $2
       GROUP BY version
       ORDER BY version DESC`,
      [classId, academicSessionId],
    );
    return rows;
  },

  // ── writing the audit trail ──
  // if a client is passed it becomes part of the ongoing transaction (atomic), otherwise a separate pool query
  async logAudit(
    {
      action,
      classId,
      academicSessionId,
      actorId = null,
      fromVersion = null,
      toVersion = null,
      detail = null,
    },
    client = null,
  ) {
    const exec = client ? client.query.bind(client) : query;
    const { rows } = await exec(
      `INSERT INTO ranking_audit_log
         (action, class_id, academic_session_id, actor_id, from_version, to_version, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        action,
        classId,
        academicSessionId,
        actorId,
        fromVersion,
        toVersion,
        detail ? JSON.stringify(detail) : null,
      ],
    );
    return rows[0];
  },

  async getAuditLog(classId, academicSessionId, limit = 50) {
    const { rows } = await query(
      `SELECT al.*, u.full_name AS actor_name
       FROM ranking_audit_log al
       LEFT JOIN users u ON u.id = al.actor_id
       WHERE al.class_id = $1 AND al.academic_session_id = $2
       ORDER BY al.created_at DESC
       LIMIT $3`,
      [classId, academicSessionId, limit],
    );
    return rows;
  },
};
