const db = require("../../config/db");

// CREATE
const enrollStudent = async (data) => {
    const result = await db.query(
        `INSERT INTO student_enrollments
         (student_id, class_id, section_id, academic_session_id, roll_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            data.student_id,
            data.class_id,
            data.section_id,
            data.academic_session_id,
            data.roll_number
        ]
    );
    return result.rows[0];
};

// GET ALL
const getEnrollments = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM student_enrollments se
        LEFT JOIN students st       ON se.student_id = st.id
        LEFT JOIN classes c         ON se.class_id = c.id
        LEFT JOIN sections s        ON se.section_id = s.id
        LEFT JOIN academic_sessions ac ON se.academic_session_id = ac.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            se.*,
            st.full_name    AS student_name,
            st.student_code,
            c.name          AS class_name,
            s.name          AS section_name,
            ac.name         AS session_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT se.id)
        ${baseJoins}
    `;

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
        SELECT COUNT(*) FROM student_enrollments
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateEnrollment = async (id, data) => {
    const result = await db.query(
        `UPDATE student_enrollments
         SET
             student_id          = $1,
             class_id            = $2,
             section_id          = $3,
             academic_session_id = $4,
             roll_number         = $5,
             updated_at          = NOW()
         WHERE id = $6 AND deleted_at IS NULL
         RETURNING *`,
        [
            data.student_id,
            data.class_id,
            data.section_id,
            data.academic_session_id,
            data.roll_number,
            id
        ]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteEnrollment = async (id) => {
    const result = await db.query(
        `UPDATE student_enrollments SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { enrollStudent, getEnrollments, globalCount, updateEnrollment, deleteEnrollment };