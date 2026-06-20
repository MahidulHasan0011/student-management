import { query, withTransaction } from "../../config/db.js";
import { buildWhereClause } from "../../utils/queryBuilder.js";
import { buildOrder } from "../../utils/order.js";


// JOIN আছে তাই alias "r" — buildWhereClause-এ baseAlias="r" পাঠাতে হবে
const SORTABLE_FIELDS = {
  name: "r.name",
  created_at: "r.created_at",
};

const FILTER_CONFIG = {
  searchableColumns: ["r.name"],
  filterableColumns: [],
};

export const roleRepository = {
  async create({ name }) {
    const { rows } = await query(
        `INSERT INTO roles (name) VALUES ($1) RETURNING *`,
        [name]
    );
    return rows[0];
},

async findAll(queryOptions,{ limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, "r");
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, "created_at");
    
    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const {rows} = await query(
        `SELECT r.*,
         COALESCE(json_agg(
           json_build_object('id', p.id, 'name', p.name)
         ) FILTER (WHERE p.id IS NOT NULL), '[]') AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.deleted_at IS NULL
       LEFT JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
       ${where}
       GROUP BY r.id
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );
   return rows;
},

async countAll(queryOptions) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, "r");

    const { rows } = await query(`SELECT COUNT(*) FROM roles r ${where}`, values);
    return parseInt(rows[0].count);
},

async findById(id) {
    const { rows } = await query(
      `SELECT r.*,
         COALESCE(json_agg(
           json_build_object('id', p.id, 'name', p.name)
         ) FILTER (WHERE p.id IS NOT NULL), '[]') AS permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.deleted_at IS NULL
       LEFT JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL
       WHERE r.id = $1 AND r.deleted_at IS NULL
       GROUP BY r.id`,
      [id]
    );
    return rows[0] || null;
},

async findByName(name) {
 const { rows } = await query(
    `SELECT * FROM roles WHERE name = $1 AND deleted_at IS NULL`,
    [name]
);
return rows[0] || null;
},

async update(id, { name }) {
 const { rows } = await query(
    `UPDATE roles SET name = $1, updated_at = NOW()
    WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
    [name, id]
);
return rows[0] || null;
},
  async syncPermissions(roleId, permissionIds) {
    return withTransaction(async (client) => {
      await client.query(
        `UPDATE role_permissions SET deleted_at = NOW()
         WHERE role_id = $1 AND deleted_at IS NULL`,
        [roleId]
      );
      if (!permissionIds.length) return;
      const values = permissionIds.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}
         ON CONFLICT (role_id, permission_id) DO UPDATE SET deleted_at = NULL, updated_at = NOW()`,
        [roleId, ...permissionIds]
      );
    });
  },


  async getPermissionNames(roleId) {
    const { rows } = await query(
      `SELECT p.name FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND rp.deleted_at IS NULL AND p.deleted_at IS NULL`,
      [roleId]
    );
    return rows.map((r) => r.name);
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE roles SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    return rows[0] || null;
  },
}

