const db = require("../../config/db");

const createSubject = async (data) => {
    const query = `INSERT INTO subjects (name, code) VALUES ($1, $2) RETURNING *`;
    const values = [data.name, data.code];
    const result = await db.query(query, values);
    return result.rows[0];
};
const getAllSubjects = async () => {
    const query = `SELECT * FROM subjects WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
};
const updateSubject = async (id, data) => {
    const query = `UPDATE subjects SET name= $1, code= $2, updated_at = NOW()
     WHERE id = $3 AND deleted_at IS NULL RETURNING *`;
    const values = [data.name, data.code, id];
    const result = await db.query(query, values);
    return result.rows[0];
};
const deleteSubject = async (id) => {
    const query = `UPDATE subjects SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    createSubject,
    getAllSubjects,
    updateSubject,
    deleteSubject
};