const db = require("../../config/db");

const createUser = async (data) => {
  const result = await db.query(
    `
    INSERT INTO users
    (
      full_name,
      email,
      password,
      role_id
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
    [
      data.full_name,
      data.email,
      data.password,
      data.role_id,
    ]
  );

  return result.rows[0];
};

const getUsers = async () => {
  const result = await db.query(`
    SELECT id, full_name, email
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

  return result.rows;
};
const updateUser = async (id, data) => {
    const result = await db.query(
        `
    UPDATE users
    SET
      full_name = $1,
        email = $2,
        password = $3,
        role_id = $4,
      updated_at = NOW()
    WHERE id = $5 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            data.full_name,
            data.email,
            data.password,
            data.role_id,
            id
        ]);
   return result.rows[0];
}; 
const deleteUser = async (id) => {
    const result = await db.query(
        `
    UPDATE users
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};      
        

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
};