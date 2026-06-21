import { query } from "../../config/db.js";
export const authRepository = {
     async findByEmail(email) {
    const { rows } = await query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1 AND u.deleted_at IS NULL`,
      [email]
    );
    return rows[0] || null;
  },
  async findById(id) {
    const { rows } = await query(
      `SELECT u.id, u.full_name, u.email, u.role_id, u.is_active,
              u.gender, u.created_at, r.name AS role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },


}