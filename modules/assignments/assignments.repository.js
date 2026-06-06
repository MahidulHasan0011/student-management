const db = require("../../config/db");

// CREATE
const assignSubject = async (data) => {
    const result = await db.query(
        `INSERT INTO subject_assignments
         (teacher_id, class_id, section_id, subject_id, academic_session_id, assigned_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            data.teacher_id,
            data.class_id,
            data.section_id,
            data.subject_id,
            data.academic_session_id,
            data.assigned_by
        ]
    );
    return result.rows[0];
};

// GET ALL
const getAssignments = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef, hasSearch }) => {
    const baseJoins = `
        FROM subject_assignments sa
        LEFT JOIN teachers t       ON sa.teacher_id = t.id
        LEFT JOIN users u          ON t.user_id = u.id
        LEFT JOIN classes c        ON sa.class_id = c.id
        LEFT JOIN sections s       ON sa.section_id = s.id
        LEFT JOIN subjects sub     ON sa.subject_id = sub.id
        LEFT JOIN academic_sessions ac ON sa.academic_session_id = ac.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            sa.*,
            u.full_name AS teacher_name,
            u.email     AS teacher_email,
            c.name      AS class_name,
            s.name      AS section_name,
            sub.name    AS subject_name,
            ac.name     AS session_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    // has search  (relational count)
    // does not have search → fast count on subject_assignments table
    const countQuery = hasSearch
        ? `SELECT COUNT(DISTINCT sa.id) ${baseJoins}`
        : `SELECT COUNT(sa.id)
           FROM subject_assignments sa
           ${whereClause}`;

    const filterValues = [...values];
    const mainValues   = [...values, limit, offset];

    const [dataResult, countResult] = await Promise.all([
        db.query(mainQuery, mainValues),
        db.query(countQuery, filterValues)
    ]);

    return {
        rows:          dataResult.rows,
        filteredCount: parseInt(countResult.rows[0].count)
    };
};

// GLOBAL COUNT
const globalCount = async () => {
    const result = await db.query(`
        SELECT COUNT(id) FROM subject_assignments
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateAssignment = async (id, data) => {
    const result = await db.query(
        `UPDATE subject_assignments
         SET
             teacher_id          = $1,
             class_id            = $2,
             section_id          = $3,
             subject_id          = $4,
             academic_session_id = $5,
             assigned_by         = $6,
             updated_at          = NOW()
         WHERE id = $7 AND deleted_at IS NULL
         RETURNING *`,
        [
            data.teacher_id,
            data.class_id,
            data.section_id,
            data.subject_id,
            data.academic_session_id,
            data.assigned_by,
            id
        ]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteAssignment = async (id) => {
    const result = await db.query(
        `UPDATE subject_assignments SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { assignSubject, getAssignments, globalCount, updateAssignment, deleteAssignment };