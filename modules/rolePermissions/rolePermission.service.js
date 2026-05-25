const db = require("../../config/db");

const assignRolePermission = async (data) => {
  const result = await db.query(
    `
    INSERT INTO role_permissions
    (role_id, permission_id)
    VALUES($1,$2)
    RETURNING *
    `,
    [
      data.role_id,
      data.permission_id,
    ]
  );

  return result.rows[0];
};
const getRolePermissions = async () => {
  const result = await db.query(`
    SELECT *
    FROM role_permissions
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);
  return result.rows;
};
const updateRolePermission = async (id, data) => {
    const result = await db.query(
        `
    UPDATE role_permissions
    SET
    role_id = $1,
    permission_id = $2
    WHERE id = $3 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            data.role_id,
            data.permission_id,
            id
        ]);
   return result.rows[0];
}; 
const deleteRolePermission = async (id) => {
    const result = await db.query(
        `
    UPDATE role_permissions
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};

module.exports = {
  assignRolePermission,
  getRolePermissions,
  updateRolePermission,
  deleteRolePermission
};
