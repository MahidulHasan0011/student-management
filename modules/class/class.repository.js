import { query } from "../../config/db.js";
import { buildWhereClause } from "../../utils/queryBuilder.js";
import { buildOrder } from "../../utils/order.js";

const SORTABLE_FIELDS = {
  name: "name",
  created_at: "created_at",
};

const FILTER_CONFIG = {
  searchableColumns: ["name"],
  filterableColumns: [],
};

export const classRepository = {
  async create({ name }) {
    const { rows } = await query(
      `INSERT INTO classes (name) VALUES ($1) RETURNING *`,
      [name]
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, "created_at");

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT * FROM classes
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
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { rows } = await query(`SELECT COUNT(*) FROM classes ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM classes WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  // class এর সাথে তার সব section (যদি থাকে) একসাথে — খুব common use case
  async findByIdWithSections(id) {
    const { rows } = await query(
      `SELECT
         c.*,
         COALESCE(json_agg(
           json_build_object('id', s.id, 'name', s.name, 'max_capacity', s.max_capacity)
           ORDER BY s.name
         ) FILTER (WHERE s.id IS NOT NULL), '[]') AS sections
       FROM classes c
       LEFT JOIN sections s ON s.class_id = c.id AND s.deleted_at IS NULL
       WHERE c.id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id`,
      [id]
    );
    return rows[0] || null;
  },

  async findByName(name) {
    const { rows } = await query(
      `SELECT * FROM classes WHERE name = $1 AND deleted_at IS NULL`,
      [name]
    );
    return rows[0] || null;
  },

  async update(id, { name }) {
    const { rows } = await query(
      `UPDATE classes SET name = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [name, id]
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE classes SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    return rows[0] || null;
  },

  // delete করার আগে চেক — কোনো section/enrollment আছে কিনা
  async hasSections(id) {
    const { rows } = await query(
      `SELECT id FROM sections WHERE class_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return rows.length > 0;
  },
};