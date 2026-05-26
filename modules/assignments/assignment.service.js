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
  const {sortBy, sortOrder} = buildOrder(queryOptions,{
    created_at: "sa.created_at", 
    teacher_name: "u.full_name",
    teacher_email: "u.email",
    class_name: "c.name", 
    section_name: "s.name", 
    subject_name: "sub.name",
    session_name: "ac.name"
  });
  const values = [];
  const countRef = { value: 1 };
  const config = {
    searchableColumns: [
      "u.full_name",
      "u.email",
      "c.name",
      "s.name",
      "sub.name",
      "ac.name"
    ],

    filterableColumns: [
      "sa.teacher_id",
      "sa.class_id",
      "sa.section_id",
      "sa.subject_id",
      "sa.academic_session_id"
    ]
  };
const whereClause = buildWhereClause(
    queryOptions,
    values,
    config,
    countRef,
    "sa"
)
 // MAIN DATA QUERY

const query = `
SELECT
  sa.*,
  u.full_name AS teacher_name,
  u.email AS teacher_email,
  c.name AS class_name,
  s.name AS section_name,
  sub.name AS subject_name,
  ac.name AS session_name
  
FROM subject_assignments sa

LEFT JOIN teachers t
  ON sa.teacher_id = t.id

LEFT JOIN users u
  ON t.user_id = u.id

LEFT JOIN classes c
  ON sa.class_id = c.id

LEFT JOIN sections s
  ON sa.section_id = s.id

LEFT JOIN subjects sub
  ON sa.subject_id = sub.id

LEFT JOIN academic_sessions ac
  ON sa.academic_session_id = ac.id

${whereClause}
ORDER BY ${sortBy} ${sortOrder}
LIMIT $${countRef.value}
OFFSET $${countRef.value + 1}
`;
values.push(limit, offset); 

const result = await db.query(query, values);

// SMART DUAL COUNT SYSTEM
  const isRelationalQuery =
    queryOptions.search ||
    queryOptions.teacher_id ||
    queryOptions.class_id ||
    queryOptions.section_id ||
    queryOptions.subject_id ||
    queryOptions.academic_session_id;

  let totalQuery;

// FAST COUNT (no joins)
if (!isRelationalQuery) {
    totalQuery = `
      SELECT COUNT(sa.id)
      FROM subject_assignments sa
      WHERE sa.deleted_at IS NULL
    `;
  }

// ACCURATE COUNT (with joins)  
else{
   totalQuery = `
SELECT COUNT(DISTINCT sa.id)
FROM subject_assignments sa

LEFT JOIN teachers t
  ON sa.teacher_id = t.id

LEFT JOIN users u
  ON t.user_id = u.id

LEFT JOIN classes c
  ON sa.class_id = c.id

LEFT JOIN sections s
  ON sa.section_id = s.id

LEFT JOIN subjects sub
  ON sa.subject_id = sub.id

LEFT JOIN academic_sessions ac
  ON sa.academic_session_id = ac.id
${whereClause}
`;
}


const totalResult = await db.query(
    totalQuery,
    values.slice(0, values.length - 2)
);



  return {
      data:result.rows,
        pagination: buildPaginationMeta(
            totalResult.rows[0].count,
            page, 
            limit
        ),
  } 
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
  return  result.rows[0];
};

module.exports = {
  assignSubject,
  getAssignments,
  updateAssignment,
  deleteAssignment
};