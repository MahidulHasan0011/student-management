import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  name: 's.name',
  max_capacity: 's.max_capacity',
  created_at: 's.created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['s.name'],
  filterableColumns: [
    { param: 'class_id', column: 's.class_id' }, // ?class_id=...
  ],
};

export const sectionRepository = {
  async create({ class_id, name, max_capacity }) {
    const { rows } = await query(
      `INSERT INTO sections (class_id, name, max_capacity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [class_id, name, max_capacity ?? null],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 's');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT s.*, c.name AS class_name
       FROM sections s
       JOIN classes c ON c.id = s.class_id
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
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 's');
    const { rows } = await query(
      `SELECT COUNT(*) FROM sections s JOIN classes c ON c.id = s.class_id ${where}`,
      values,
    );
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT s.*, c.name AS class_name
       FROM sections s
       JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  // একই class-এ একই নামের section আগে আছে কিনা — duplicate check
  async findByClassAndName(class_id, name) {
    const { rows } = await query(
      `SELECT * FROM sections
       WHERE class_id = $1 AND name = $2 AND deleted_at IS NULL`,
      [class_id, name],
    );
    return rows[0] || null;
  },

  // নির্দিষ্ট class-এর সব section, name ধরে sort — roll/section বিতরণে লাগবে
  async findByClassId(class_id) {
    const { rows } = await query(
      `SELECT * FROM sections
       WHERE class_id = $1 AND deleted_at IS NULL
       ORDER BY name ASC`,
      [class_id],
    );
    return rows;
  },

  // একটা section-এ এখন কত ছাত্র enrolled আছে — capacity check-এর জন্য
  async countEnrolledStudents(sectionId) {
    const { rows } = await query(
      `SELECT COUNT(*) FROM student_enrollments
       WHERE section_id = $1 AND deleted_at IS NULL`,
      [sectionId],
    );
    return parseInt(rows[0].count);
  },

  async update(id, { name, max_capacity }) {
    const setClauses = [];
    const params = [];

    if (name !== undefined) {
      params.push(name);
      setClauses.push(`name = $${params.length}`);
    }
    if (max_capacity !== undefined) {
      params.push(max_capacity);
      setClauses.push(`max_capacity = $${params.length}`);
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE sections SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE sections SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  async hasEnrollments(id) {
    const { rows } = await query(
      `SELECT id FROM student_enrollments WHERE section_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  },
};
