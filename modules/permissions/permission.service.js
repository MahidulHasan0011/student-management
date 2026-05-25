const db = require("../../config/db");

const createPermission = async (data) => {
  const result = await db.query(
    `
    INSERT INTO permissions(name)
    VALUES($1)
    RETURNING *
    `,
    [data.name]
  );

  return result.rows[0];
};
const getPermissions = async () => {
  const result = await db.query(`
    SELECT *
    FROM permissions
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);
  return result.rows;
};
const updatePermission = async (id, data) => {
    const result = await db.query(
        ` 
    UPDATE permissions
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
const deletePermission = async (id) => {
    const result = await db.query(
        `
    UPDATE permissions
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};      

module.exports = {
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission
};