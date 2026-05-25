const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const assignSubject = async (data) => {
  const result = await db.query(
    `
    INSERT INTO subject_assignments
    (
      teacher_id,
      class_id,
      section_id,
      subject_id,
      academic_session_id,
      assigned_by
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [
      data.teacher_id,
      data.class_id,
      data.section_id,
      data.subject_id,
      data.academic_session_id,
      data.assigned_by,
    ]
  );

  return result.rows[0];
};

const getAssignments = async (queryOptions) => {
  //pagination
  const { page, limit, offset } = buildPagination(queryOptions);
    //sorting
  const {sortBy, sortOrder} = buildOrder(queryOptions,["created_at", "name"]);
  const values = [];
  const countRef = { value: 1 };
  const config = {
    searchableColumns: [
      "t.full_name",
      "c.name",
      "s.name",
      "sub.name"
    ],

    filterableColumns: [
      "teacher_id",
      "class_id",
      "section_id",
      "subject_id",
      "academic_session_id"
    ]
  };




  const result = await db.query(`
    SELECT *
    FROM subject_assignments
    WHERE deleted_at IS NULL
  `);

  return result.rows;
};

const updateAssignment = async (id, data) => {
  const result = await db.query(
    `
    UPDATE subject_assignments
    SET
      teacher_id = $1,
        class_id = $2,
        section_id = $3,
        subject_id = $4,
        academic_session_id = $5,
        assigned_by = $6,
        updated_at = NOW()
    WHERE id = $7 AND deleted_at IS NULL
    RETURNING *
    `,
    [
      data.teacher_id,
      data.class_id,
        data.section_id,
        data.subject_id,
        data.academic_session_id,
        data.assigned_by,
      id,
    ]
  );

  return result.rows[0];
};

const deleteAssignment = async (id) => {
  const result = await db.query(
    `
    UPDATE subject_assignments
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  assignSubject,
  getAssignments,
  updateAssignment,
  deleteAssignment
};