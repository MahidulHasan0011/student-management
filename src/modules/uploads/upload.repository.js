import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  created_at: 'created_at',
  file_size: 'file_size',
  original_name: 'original_name',
  category: 'category',
};

const FILTER_CONFIG = {
  searchableColumns: ['original_name'], // ?search=...
  filterableColumns: [
    { param: 'category', column: 'category' },
    { param: 'status', column: 'status' },
    { param: 'uploaded_by', column: 'uploaded_by' },
    { param: 'related_type', column: 'related_type' },
    { param: 'related_id', column: 'related_id' },
  ],
};

export const uploadRepository = {
  // PENDING row — created in the generate-url step. becomes READY on confirm.
  async create({
    storage_key,
    original_name,
    mime_type,
    extension,
    file_size,
    category,
    uploaded_by,
    related_type,
    related_id,
  }) {
    const { rows } = await query(
      `INSERT INTO uploads
        (storage_key, original_name, mime_type, extension, file_size,
         category, uploaded_by, related_type, related_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        storage_key,
        original_name,
        mime_type,
        extension,
        file_size,
        category,
        uploaded_by,
        related_type || null,
        related_id || null,
      ],
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM uploads WHERE id = $1 AND deleted_at IS NULL`, [
      id,
    ]);
    return rows[0] || null;
  },

  // restore/audit also needs the soft-deleted row
  async findByIdWithDeleted(id) {
    const { rows } = await query(`SELECT * FROM uploads WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  // confirm: PENDING → READY, set the verified size/checksum/metadata
  async markReady(id, { file_size, checksum, metadata }) {
    const { rows } = await query(
      `UPDATE uploads
         SET status = 'READY', file_size = $2, checksum = $3,
             metadata = $4::jsonb, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id, file_size, checksum || null, JSON.stringify(metadata || {})],
    );
    return rows[0] || null;
  },

  async markFailed(id) {
    const { rows } = await query(
      `UPDATE uploads SET status = 'FAILED', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const { rows } = await query(
      `SELECT * FROM uploads
       ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${countRef.value} OFFSET $${countRef.value + 1}`,
      values,
    );
    return rows;
  },

  async countAll(queryOptions) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef);
    const { rows } = await query(`SELECT COUNT(*) FROM uploads ${where}`, values);
    return parseInt(rows[0].count);
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE uploads SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  async restore(id) {
    const { rows } = await query(
      `UPDATE uploads SET deleted_at = NULL, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [id],
    );
    return rows[0] || null;
  },

  // ── audit log ──
  async insertAudit({ upload_id, action, actor_id, ip_address, user_agent, detail }) {
    await query(
      `INSERT INTO upload_audit_logs
        (upload_id, action, actor_id, ip_address, user_agent, detail)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [
        upload_id,
        action,
        actor_id || null,
        ip_address || null,
        user_agent || null,
        JSON.stringify(detail || {}),
      ],
    );
  },
};
