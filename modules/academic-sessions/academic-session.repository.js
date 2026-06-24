import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  name: 'name',
  start_date: 'start_date',
  end_date: 'end_date',
  created_at: 'created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['name'],
  filterableColumns: [
    { param: 'is_active', column: 'is_active' }, // ?is_active=true
  ],
};

export const academicSessionRepository = {
  async create({ name, start_date, end_date, admission_test_enabled }) {
    const { rows } = await query(
      `INSERT INTO academic_sessions (name, start_date, end_date, admission_test_enabled)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, start_date || null, end_date || null, admission_test_enabled ?? true],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const normalizedQuery = { ...queryOptions };
    if (normalizedQuery.is_active !== undefined) {
      normalizedQuery.is_active = normalizedQuery.is_active === 'true';
    }

    const where = buildWhereClause(normalizedQuery, values, FILTER_CONFIG, countRef);
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT * FROM academic_sessions
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

    const normalizedQuery = { ...queryOptions };
    if (normalizedQuery.is_active !== undefined) {
      normalizedQuery.is_active = normalizedQuery.is_active === 'true';
    }

    const where = buildWhereClause(normalizedQuery, values, FILTER_CONFIG, countRef);
    const { rows } = await query(`SELECT COUNT(*) FROM academic_sessions ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT * FROM academic_sessions WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  async findByName(name) {
    const { rows } = await query(
      `SELECT * FROM academic_sessions WHERE name = $1 AND deleted_at IS NULL`,
      [name],
    );
    return rows[0] || null;
  },

  // একসাথে শুধু একটাই active session থাকতে পারবে
  async findActive() {
    const { rows } = await query(
      `SELECT * FROM academic_sessions WHERE is_active = true AND deleted_at IS NULL LIMIT 1`,
    );
    return rows[0] || null;
  },

  async update(id, fields) {
    const allowed = ['name', 'start_date', 'end_date'];
    const setClauses = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE academic_sessions SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  // নতুনটা active করার আগে সব session deactivate — caller (service) transaction-এ চালাবে
  async deactivateAll(client) {
    await client.query(
      `UPDATE academic_sessions SET is_active = false, updated_at = NOW()
       WHERE is_active = true AND deleted_at IS NULL`,
    );
  },

  async setActive(client, id) {
    const { rows } = await client.query(
      `UPDATE academic_sessions SET is_active = true, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  async toggleAdmissionTest(id, admission_test_enabled) {
    const { rows } = await query(
      `UPDATE academic_sessions SET admission_test_enabled = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, admission_test_enabled`,
      [admission_test_enabled, id],
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE academic_sessions SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },
};
