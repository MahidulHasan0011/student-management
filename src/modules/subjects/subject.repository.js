import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  name: 'name',
  code: 'code',
  created_at: 'created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['name', 'code'],
  filterableColumns: [],
};

export const subjectRepository = {
  async create({ name, code }) {
    const { rows } = await query(`INSERT INTO subjects (name, code) VALUES ($1, $2) RETURNING *`, [
      name,
      code || null,
    ]);
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'name');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT * FROM subjects
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
    const { rows } = await query(`SELECT COUNT(*) FROM subjects ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM subjects WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    return rows[0] || null;
  },

  async findByName(name) {
    const { rows } = await query(`SELECT * FROM subjects WHERE name = $1 AND deleted_at IS NULL`, [
      name,
    ]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const { rows } = await query(`SELECT * FROM subjects WHERE code = $1 AND deleted_at IS NULL`, [
      code,
    ]);
    return rows[0] || null;
  },

  async update(id, { name, code }) {
    const setClauses = [];
    const params = [];

    if (name !== undefined) {
      params.push(name);
      setClauses.push(`name = $${params.length}`);
    }
    if (code !== undefined) {
      params.push(code);
      setClauses.push(`code = $${params.length}`);
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE subjects SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE subjects SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  async isAssignedToTeacher(id) {
    const { rows } = await query(
      `SELECT id FROM subject_assignments WHERE subject_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  },
};
