import { query } from '../../config/db.js';

// ── Ranking module-এর read query + audit log লেখা ──
// roll.engine transaction-এর ভেতর থেকে logAudit ডাকা হবে (client পাঠিয়ে),
// আবার service থেকেও সরাসরি ডাকা যাবে (client ছাড়া → pool query)
export const rankingRepository = {
  // class+session-এর সর্বশেষ version-এর snapshot — এটাই "current ranking"
  // (live student_enrollments.roll_number-এর বদলে authoritative history snapshot পড়ি,
  //  কারণ এখানে rank_position + total_score একসাথে থাকে)
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

  // নির্দিষ্ট version (বা version না দিলে সব version) snapshot — history viewer-এর জন্য
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

  // কোন কোন version আছে — history dropdown বানাতে
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

  // ── audit trail লেখা ──
  // client পাঠালে চলমান transaction-এর অংশ হবে (atomic), নাহলে আলাদা pool query
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
