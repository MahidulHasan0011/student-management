const db = require("../../config/db");

// CREATE USER
const createUser = async (client, data) => {
    return await client.query(
        `INSERT INTO users (full_name, email, password, role_id, gender)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [data.full_name, data.email, data.password, data.role_id, data.gender]
    );
};

// CREATE TEACHER
const createTeacher = async (client, user_id, data) => {
    const result = await client.query(
        `INSERT INTO teachers (user_id, phone, designation, qualification, joining_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, data.phone, data.designation, data.qualification, data.joining_date]
    );
    return result.rows[0];
};

// GET ALL
const getAllTeachers = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM teachers t
        LEFT JOIN users u ON t.user_id = u.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            t.*,
            u.full_name,
            u.email,
            u.gender,
            u.is_active
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT t.id)
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
        SELECT COUNT(*) FROM teachers WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};


const getTeacherById = async (id) => {
    const result = await db.query(
        `SELECT * FROM teachers WHERE id = $1 AND deleted_at IS NULL`,
        [id]
    );
    return result.rows[0];
};

// UPDATE
const updateTeacher = async (id, data) => {
    // 1. teachers table update
    const teacherResult = await db.query(
        `UPDATE teachers
         SET
             phone         = COALESCE($1, phone),
             designation   = COALESCE($2, designation),
             qualification = COALESCE($3, qualification),
             joining_date  = COALESCE($4, joining_date),
             updated_at    = NOW()
         WHERE id = $5 AND deleted_at IS NULL
         RETURNING *`,
        [data.phone, data.designation, data.qualification, data.joining_date, id]
    );

    if (!teacherResult.rows[0]) return null;

    // 2. users table update
    await db.query(
        `UPDATE users
         SET
             full_name  = COALESCE($1, full_name),
             gender     = COALESCE($2, gender),
             updated_at = NOW()
         WHERE id = (SELECT user_id FROM teachers WHERE id = $3)`,
        [data.full_name, data.gender, id]
    );

    return teacherResult.rows[0];
};

// DELETE (soft)
const deleteTeacher = async (id) => {
    const result = await db.query(
        `UPDATE teachers SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createUser, createTeacher, getAllTeachers, globalCount, getTeacherById, updateTeacher, deleteTeacher };