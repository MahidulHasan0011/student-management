const db = require("../../config/db");

//create academic session
const createSession = async (data) => {
    const query = `INSERT INTO academic_sessions (name, start_date, end_date,is_active) 
    VALUES ($1, $2, $3, $4)
     RETURNING *`;

   const values = [data.name, data.start_date, data.end_date, data.is_active];
   const result = await db.query(query, values);
   return result.rows[0];  
}
//get all academic sessions
const getAllSessions = async () => {
    const query = `SELECT * FROM academic_sessions
                   WHERE deleted_at  IS NULL
                   ORDER BY created_at DESC`;
    const result = await db.query(query);
    return result.rows;
}
//update academic session
const updateSession = async (id, data) => {
    const query = `UPDATE academic_sessions 
                   SET name = $1, start_date = $2, end_date = $3, is_active = $4, updated_at=NOW()
                   WHERE id = $5 AND deleted_at IS NULL
                   RETURNING *`;
    const values = [data.name, data.start_date, data.end_date, data.is_active, id]; 
    const result = await db.query(query, values);
    return result.rows[0];
}  

//delete academic session by id (soft delete)
const deleteSession = async (id) => {
    const query = `UPDATE academic_sessions 
                   SET deleted_at = NOW()
                   WHERE id = $1 
                   RETURNING *`;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows[0];
}

module.exports = {
  createSession,
  getAllSessions,
  updateSession,
  deleteSession,
};