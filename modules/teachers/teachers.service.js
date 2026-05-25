const db = require("../../config/db");
const createTeacherst = async (data) => {
    const query = `INSERT INTO subjects (user_id, phone, designation, qualification) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [data.user_id, data.phone, data.designation, data.qualification];
    const result = await db.query(query, values);
    return result.rows[0];
};
const getAllTeacherst = async () => {
    const query = `SELECT * FROM teachers WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
};
const updateTeacherst = async (id, data) => {
    const query = `UPDATE teachers SET user_id= $1, phone= $2, designation= $3, qualification= $4, updated_at = NOW()
     WHERE id = $5 AND deleted_at IS NULL RETURNING *`;
    const values = [data.user_id, data.phone, data.designation, data.qualification, id];
    const result = await db.query(query, values);
    return result.rows[0];
};
const deleteTeacherst = async (id) => {
    const query = `UPDATE teachers SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    createTeacherst,
    getAllTeacherst,
    updateTeacherst,
    deleteTeacherst
};