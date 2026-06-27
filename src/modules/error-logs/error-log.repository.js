import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  created_at: 'created_at',
  status_code: 'status_code',
};

const FILTER_CONFIG = {
  searchableColumns: ['message', 'path'],
  filterableColumns: ['status_code', 'method', 'is_operational', 'user_id'],
};

export const errorLogRepository = {
  async create({ name, message, stack, statusCode, isOperational, method, path, context, userId }) {
    const { rows } = await query(
      `INSERT INTO error_logs
        (name, message, stack, status_code, is_operational, method, path, context, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name || null,
        message,
        stack || null,
        statusCode ?? null,
        isOperational ?? false,
        method || null,
        path || null,
        context ? JSON.stringify(context) : null,
        userId || null,
      ],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT * FROM error_logs
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
    const { rows } = await query(`SELECT COUNT(*) FROM error_logs ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM error_logs WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE error_logs SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  // সব (বা একটি তারিখের আগের) log একসাথে soft-delete করতে — log table পরিষ্কার রাখতে
  async clear(before) {
    if (before) {
      const { rowCount } = await query(
        `UPDATE error_logs SET deleted_at = NOW()
         WHERE deleted_at IS NULL AND created_at < $1`,
        [before],
      );
      return rowCount;
    }
    const { rowCount } = await query(
      `UPDATE error_logs SET deleted_at = NOW() WHERE deleted_at IS NULL`,
    );
    return rowCount;
  },
};
