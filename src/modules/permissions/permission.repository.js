import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

// When sortBy=name, the real column name is looked up from this map — to prevent SQL injection
const SORTABLE_FIELDS = {
  name: 'name',
  created_at: 'created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['name'],
  filterableColumns: [], // no extra filters on permissions
};

export const permissionRepository = {
  async create({ name }) {
    const { rows } = await query(`INSERT INTO permissions (name) VALUES ($1) RETURNING *`, [name]);
    return rows[0];
  },

  // queryOptions = { search, sortBy, sortOrder } coming from req.query
  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT * FROM permissions
       ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values,
    );
    return rows;
  },

  async countAll(queryOptions) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);

    const { rows } = await query(`SELECT COUNT(*) FROM permissions ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM permissions WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    return rows[0] || null;
  },

  async findByName(name) {
    const { rows } = await query(
      `SELECT * FROM permissions WHERE name = $1 AND deleted_at IS NULL`,
      [name],
    );
    return rows[0] || null;
  },

  async update(id, { name }) {
    const { rows } = await query(
      `UPDATE permissions SET name = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [name, id],
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await query(
      `UPDATE permissions SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  async findByIds(ids) {
    const { rows } = await query(
      `SELECT id FROM permissions WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [ids],
    );
    return rows;
  },
};
