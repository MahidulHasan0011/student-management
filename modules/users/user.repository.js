import { query} from "../../config/db.js";
import { buildWhereClause } from "../../utils/queryBuilder.js";
import { buildOrder } from "../../utils/order.js";


const SAFE_COLUMNS = `
  u.id, u.full_name, u.email, u.role_id, u.is_active,
  u.gender, u.created_at, u.updated_at,
  r.name AS role_name
`;

// JOIN আছে — alias "u"
const SORTABLE_FIELDS = {
  full_name: "u.full_name",
  email: "u.email",
  created_at: "u.created_at",
};

const FILTER_CONFIG = {
  searchableColumns: ["u.full_name", "u.email"],
  filterableColumns: [
    { param: "role_id", column: "u.role_id" },     // ?role_id=...
    { param: "is_active", column: "u.is_active" }, // ?is_active=true
  ],
};

export const userRepository = {

async create({full_name, email, password, role_id, gender}) {

    const {rows} = await query(
        `INSERT INTO users (full_name, email, password, role_id, gender)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [full_name, email, password, role_id, gender || "MALE"]
    );
    return rows[0];
},

async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

      // is_active আসে string হিসেবে ("true"/"false") — boolean-এ convert করতে হবে
    const normalizedQuery = { ...queryOptions };
    if (normalizedQuery.is_active !== undefined) {
      normalizedQuery.is_active = normalizedQuery.is_active === "true";
    }

    const where = buildWhereClause(normalizedQuery, values, FILTER_CONFIG, countRef, "u");
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, "created_at");
    
    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT ${SAFE_COLUMNS}
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );
    return rows;
},
async countAll(queryOptions) {
      const values = [];
    const countRef = { value: 1 };

    const normalizedQuery = { ...queryOptions };
    if (normalizedQuery.is_active !== undefined) {
      normalizedQuery.is_active = normalizedQuery.is_active === "true";
    }
    const where = buildWhereClause(normalizedQuery, values, FILTER_CONFIG, countRef, "u");

    const { rows } = await query(
        `SELECT COUNT(*) FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         ${where}`,
        values
    );
    return parseInt(rows[0].count);
},

async findById(id) {
    const { rows } = await query(
        `SELECT ${SAFE_COLUMNS}
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND u.deleted_at IS NULL`,
        [id]
    );
    return rows[0] || null;
},

async findByEmail(email) {
    const { rows } = await query(
        `SELECT id, email FROM users WHERE email = $1 AND deleted_at IS NULL`,
        [email]
    );
    return rows[0] || null;
},
// async findByEmail(email) {
//     const { rows } = await query(
//         `SELECT id, full_name, email, role_id, gender, is_active
//          FROM users u
//          LEFT JOIN roles r ON r.id = u.role_id
//          WHERE u.email = $1 AND u.deleted_at IS NULL`,
//         [email]
//     );
//     return rows[0] || null;
// },

 async findWithPassword(id) {
    const { rows } = await query(
      `SELECT id, password FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },
 

  async update(id, fields) {
    const setClauses = [];
    const params = [];
    const allowed = ["full_name", "email", "role_id", "gender"];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }
    if (!setClauses.length) return null;
 
    params.push(id);
    const { rows } = await query(
      `UPDATE users SET ${setClauses.join(", ")}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING id, full_name, email, role_id, is_active, gender, updated_at`,
      params
    );
    return rows[0] || null;
  },

    async updatePassword(id, hashedPassword) {
    await query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, id]
    );
  },
 
  async toggleActive(id, is_active) {
    const { rows } = await query(
      `UPDATE users SET is_active = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL RETURNING id, is_active`,
      [is_active, id]
    );
    return rows[0] || null;
  },
 
  async softDelete(id) {
    const { rows } = await query(
      `UPDATE users SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    return rows[0] || null;
  }
};
