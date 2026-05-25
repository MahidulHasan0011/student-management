const db = require("../../config/db");

const createRole = async (data) => {
  const result = await db.query(
    `
    INSERT INTO roles(name)
    VALUES($1)
    RETURNING *
    `,
    [data.name]
  );

  return result.rows[0];
};

const getRoles = async () => {
  const result = await db.query(`
    SELECT *
    FROM roles
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

  return result.rows;
};

const updateRole = async (id, data) => {
    const result = await db.query(
        ` 
    UPDATE roles
    SET
      name = $1,
      updated_at = NOW()
    WHERE id = $2 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            data.name,
            id
        ]);
   return result.rows[0];
}; 
const deleteRole = async (id) => {
    const result = await db.query(
        `
    UPDATE roles
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};      

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole
};