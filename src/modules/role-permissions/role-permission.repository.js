import { query } from '../../config/db.js';

export const rolePermissionRepository = {
  // All permissions of a specific role — including both id and name
  async findByRoleId(roleId) {
    const { rows } = await query(
      `SELECT rp.id AS assignment_id, rp.role_id, rp.created_at,
              p.id AS permission_id, p.name AS permission_name
            FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
            WHERE rp.role_id = $1 AND rp.deleted_at IS NULL
            ORDER BY p.name ASC`,
      [roleId],
    );
    return rows;
  },

  // Which roles a specific permission belongs to — the reverse lookup
  async findByPermissionId(permissionId) {
    const { rows } = await query(
      `SELECT rp.id AS assignment_id, rp.permission_id, rp.created_at,
              r.id AS role_id, r.name AS role_name
            FROM role_permissions rp
            JOIN roles r ON r.id = rp.role_id AND r.deleted_at IS NULL
            WHERE rp.permission_id = $1 AND rp.deleted_at IS NULL
            ORDER BY r.name ASC`,
      [permissionId],
    );
    return rows;
  },

  async exists(roleId, permissionId) {
    const { rows } = await query(
      `
            SELECT id FROM role_permissions
            WHERE role_id = $1 AND permission_id = $2 AND deleted_at IS NULL`,
      [roleId, permissionId],
    );
    return rows[0] || null;
  },

  // Find the row even if soft-deleted — needed for restoring
  async findAny(roleId, permissionId) {
    const { rows } = await query(
      `SELECT id, deleted_at FROM role_permissions
         WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId],
    );
    return rows[0] || null;
  },

  async create(roleId, permissionId) {
    const { rows } = await query(
      `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2) RETURNING *`,
      [roleId, permissionId],
    );
    return rows[0];
  },
  // Restore a previously soft-deleted row — without creating a duplicate row
  async restore(id) {
    const { rows } = await query(
      `UPDATE role_permissions SET deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },
  async softDelete(roleId, permissionId) {
    const { rows } = await query(
      `UPDATE role_permissions SET deleted_at = NOW()
          WHERE role_id = $1 AND permission_id = $2 AND deleted_at IS NULL
          RETURNING id`,
      [roleId, permissionId],
    );
    return rows[0] || null;
  },
};
