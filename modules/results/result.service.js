const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const addResult = async (data) => {
  const result = await db.query(
    `
    INSERT INTO exam_results
    (
      exam_id,
      student_id,
      subject_id,
      marks,
      grade
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      data.exam_id,
      data.student_id,
      data.subject_id,
      data.marks,
      data.grade,
    ]
  );

  return result.rows[0];
};

const getResults = async (queryOptions) => {
//pagination
  const { page, limit, offset } = buildPagination(queryOptions);

// sorting
  const {sortBy, sortOrder} = buildOrder(
    queryOptions,{   
      created_at: "er.created_at",
      marks: "er.marks",
      grade: "er.grade",
      student_name: "st.full_name",
      subject_name: "sub.name"
    }
  );
  const values = [];
  const countRef = { value: 1 };

  const config = {
    searchableColumns: [
      "st.full_name",
      "sub.name",
      "e.name",
      "er.grade"
    ],

    filterableColumns: [
      "er.exam_id",
      "er.student_id",
      "er.subject_id",
      "er.grade"
    ]
  };
  const whereClause = buildWhereClause(
    queryOptions,
    values,
    config,
    countRef,
    "er"
  );

  // MAIN QUERY
  const query = `
    SELECT
      er.*,

      e.name AS exam_name,
      st.full_name AS student_name,
      sub.name AS subject_name

      FROM exam_results er

      LEFT JOIN exams e
        ON er.exam_id = e.id

      LEFT JOIN students st
        ON er.student_id = st.id

      LEFT JOIN subjects sub
        ON er.subject_id = sub.id

      ${whereClause}

      ORDER BY ${sortBy} ${sortOrder}

      LIMIT $${countRef.value}
      OFFSET $${countRef.value + 1}
    `;

  values.push(limit, offset);

  const result = await db.query(query, values);

    // COUNT
  const totalQuery = `
    SELECT COUNT(DISTINCT er.id)
    FROM exam_results er

    LEFT JOIN exams e
      ON er.exam_id = e.id

    LEFT JOIN students st
      ON er.student_id = st.id

    LEFT JOIN subjects sub
      ON er.subject_id = sub.id

    ${whereClause}
    `;

  const totalResult = await db.query(
    totalQuery,
    values.slice(0, values.length - 2)
  );

  const filteredRecords =
    parseInt(totalResult.rows[0].count);

  const globalCountResult = await db.query(`
    SELECT COUNT(*)
    FROM exam_results
    WHERE deleted_at IS NULL
  `);

  const totalRecords =
    parseInt(globalCountResult.rows[0].count);

  const hasFilters = Boolean(
    queryOptions.search ||
    queryOptions.exam_id ||
    queryOptions.student_id ||
    queryOptions.subject_id ||
    queryOptions.grade
  );

  return{
    data:result.rows,

    message: hasFilters
      ? `Showing ${filteredRecords} matching results (${totalRecords} total)`
      : `Showing all ${totalRecords} results`,

    meta: {
      totalRecords,
      filteredRecords,
      hasFilters
    }, 
    
    pagination: buildPaginationMeta(
      filteredRecords,
      page,
      limit
    )
  };
};
const updateResult = async (id, data) => {
    const result = await db.query(
        `
    UPDATE exam_results
    SET
      exam_id = $1,
      student_id = $2,
      subject_id = $3,
      marks = $4,
      grade = $5,
      updated_at = NOW()
    WHERE id = $6 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            id,
            data.exam_id,
            data.student_id,
            data.subject_id,
            data.marks,
            data.grade
        ]);

    return result.rows[0];
}
const deleteResult = async (id) => {
    const result = await db.query(
        `
    UPDATE exam_results
    SET deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]
    );

    return result.rows[0];
};


module.exports = {
  addResult,
  getResults,
  updateResult,
  deleteResult
};