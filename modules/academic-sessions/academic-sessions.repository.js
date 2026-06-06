const db = require("../../config/db");

const createSession = async ( data) => {
    const result = await db.query(
        `
        INSERT INTO academic_sessions
        (
            name, 
            start_date, 
            end_date, 
            is_active
        )
    
        VALUES ($1,$2,$3,$4)
        RETURNING *
        `,
      [data.name, data.start_date, data.end_date, data.is_active]
    );
    return result.rows[0];
};


const getAllSessions = async (query, values) => {
    return await db.query(query, values);
};





const countStudents = async (query, values) => {
    return await db.query(query, values);
};
const globalCount = async () => {
    return await db.query(`
        SELECT COUNT(*)
        FROM students
        WHERE deleted_at IS NULL
    `);
};



const updateSession = async (id, data) => {
    const result = await db.query(
        `
        UPDATE students
        SET
            full_name = COALESCE($1, full_name),
            gender = COALESCE($2, gender),
            guardian_name = COALESCE($3, guardian_name),
            guardian_phone = COALESCE($4, guardian_phone),
            address = COALESCE($5, address),
            updated_at = NOW()
        WHERE id = $6 AND deleted_at IS NULL
        RETURNING *
        `,
        [
            data.full_name,
            data.gender,
            data.guardian_name,
            data.guardian_phone,
            data.address,
            id
        ]
    );
    return result.rows[0];
};

const deleteSession = async (id) => {
    const result = await db.query(
        `UPDATE students SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};