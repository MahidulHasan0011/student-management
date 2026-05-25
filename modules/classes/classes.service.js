const db = require("../../config/db");

const createClass = async (data) => {
    const query = `INSERT INTO classes (name) VALUES ($1) RETURNING *`;
    const values = [data.name];
    const result = await db.query(query, values);
    return result.rows[0];
};
const getAllClasses = async () => {
    const query = `SELECT * FROM classes WHERE deleted_at IS NULL ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
};
const updateClass = async(id, data) => {
    const result = await db.query(`UPDATE classes SET name = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`, [data.name, id]);
    return result.rows[0];
};
const deleteClass = async (id) => {
    const result = await db.query(`UPDATE classes SET deleted_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
};

module.exports = {
    createClass,
    getAllClasses,
    updateClass,
    deleteClass
};