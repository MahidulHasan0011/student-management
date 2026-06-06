const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination,buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createExam = async (data) => {
    const result = await db.query(
        `
    INSERT INTO exams
    (name, class_id, academic_session_id, exam_date, exam_type)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
        [
            data.name,
            data.class_id,
            data.academic_session_id,
            data.exam_date,
            data.exam_type
        ]
    );

    return result.rows[0];
};

const getExams = async (queryOptions) => {
     //pagination
    const { page, limit, offset } = buildPagination(queryOptions);

    // sorting
    const {sortBy, sortOrder} = buildOrder(
        queryOptions,{   
        created_at: "e.created_at",
        exam_name: "e.name",
        class_name: "c.name",
        session_name: "ac.name",
        exam_date: "e.exam_date",
        exam_type: "e.exam_type"
        
        }
    );
    const values = [];
    const countRef = { value: 1 };
    // config
    const config = {
        searchableColumns: [
            "e.name",
            "c.name",
            "ac.name"
        ],
        filterableColumns: [
            "e.class_id",
            "e.academic_session_id",
            "e.exam_date",
            "e.exam_type"
        ]
    };
       const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "e"
    );
    // MAIN QUERY
    const query = `
     SELECT e.*,
        c.name AS class_name,
        ac.name AS session_name
    FROM exams e
    LEFT JOIN classes c
    ON e.class_id = c.id
    LEFT JOIN academic_sessions ac
    ON e.academic_session_id = ac.id
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${countRef.value}
    OFFSET $${countRef.value + 1}`;

    values.push(limit, offset);
    const result = await db.query(
        query,
        values
    );

      // COUNT QUERY
    const totalQuery = `
        SELECT COUNT(DISTINCT e.id)

        FROM exams e

        LEFT JOIN classes c
            ON e.class_id = c.id

        LEFT JOIN academic_sessions ac
            ON e.academic_session_id = ac.id

        ${whereClause}
    `;
      const totalResult = await db.query(
        totalQuery,
        values.slice(0, values.length - 2)
    );
    const filteredRecords =
        parseInt(totalResult.rows[0].count);

    // Global Count (WITHOUT ANY FILTERS, FOR PAGINATION PURPOSES)
    const globalCountResult = await db.query(`
    SELECT COUNT(*)
    FROM exams
    WHERE deleted_at IS NULL
    `);

    const totalRecords = parseInt(globalCountResult.rows[0].count);    

    const hasFilters = Boolean(
            queryOptions.search ||
            queryOptions.class_id ||
            queryOptions.academic_session_id ||
            queryOptions.exam_date ||
            queryOptions.exam_type
        );

    return {
        data: result.rows,

        message: hasFilters
         ? `Showing ${filteredRecords} matching exams (${totalRecords} total)`
         : `Showing all ${totalRecords} exams`,

        meta:{
          totalRecords,
          filteredRecords,
          hasFilters
        },
        
        pagination: buildPaginationMeta(
            filteredRecords,
            page,
            limit
        )
    } 
};
const updateExam = async (id, data) => {
    const result = await db.query(
        `
    UPDATE exams
    SET
      name = $1,
      class_id = $2,
      academic_session_id = $3,
      exam_date = $4,
      exam_type = $5,
      updated_at = NOW()
    WHERE id = $6 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            id,
            data.name,
            data.class_id,
            data.academic_session_id,
            data.exam_date,
            data.exam_type
        ]);

    return result.rows[0];
}
const deleteExam = async (id) => {
    const result = await db.query(
        `
    UPDATE exams
    SET deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    createExam,
    getExams,
    updateExam,
    deleteExam
};