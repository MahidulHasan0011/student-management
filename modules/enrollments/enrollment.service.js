const db = require("../../config/db");

const enrollStudent = async (data) => {
  const result = await db.query(
    `
    INSERT INTO student_enrollments
    (
      student_id,
      class_id,
      section_id,
      academic_session_id,
      roll_number
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      data.student_id,
      data.class_id,
      data.section_id,
      data.academic_session_id,
      data.roll_number,
    ]
  );

  return result.rows[0];
};

const getEnrollments = async (queryOptions) => {
  //pagination
    const { page, limit, offset } = buildPagination(queryOptions);
    
  // sorting
    const {sortBy, sortOrder} = buildOrder(
        queryOptions,{   
          created_at: "se.created_at",
          student_name: "st.full_name",
          student_code: "st.student_code",
          class_name: "c.name",
          section_name: "s.name",
          session_name: "ac.name",
          roll_number: "se.roll_number"
     
        }
    );
    const values = [];
    const countRef = { value: 1 };
    // config
    const config = {
    searchableColumns: [
        "st.full_name",
        "st.student_code",
        "c.name",
        "s.name",
        "ac.name",
        "se.roll_number"
    ],

    filterableColumns: [
        "se.student_id",
        "se.class_id",
        "se.section_id",
        "se.academic_session_id"
      ]
  };
  const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "se"
    );



    const query = `
        SELECT
            se.*,

            st.full_name AS student_name,
            st.student_code,

            c.name AS class_name,

            s.name AS section_name,

            ac.name AS session_name

        FROM student_enrollments se

        LEFT JOIN students st
            ON se.student_id = st.id

        LEFT JOIN classes c
            ON se.class_id = c.id

        LEFT JOIN sections s
            ON se.section_id = s.id

        LEFT JOIN academic_sessions ac
            ON se.academic_session_id = ac.id

        ${whereClause}

        ORDER BY ${sortBy} ${sortOrder}

        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    values.push(limit, offset);
    const result = await db.query(query, values);

    // COUNT QUERY
    const totalQuery = `
        SELECT COUNT(DISTINCT se.id)

        FROM student_enrollments se

        LEFT JOIN students st
            ON se.student_id = st.id

        LEFT JOIN classes c
            ON se.class_id = c.id

        LEFT JOIN sections s
            ON se.section_id = s.id

        LEFT JOIN academic_sessions ac
            ON se.academic_session_id = ac.id

        ${whereClause}
    `;
  const totalResult = await db.query(
        totalQuery,
        values.slice(0, values.length - 2)
    );
   
  const filteredRecords =
        parseInt(totalResult.rows[0].count);
        
        
  // global count
  const globalCount = await db.query(`
    SELECT COUNT(*) 
    FROM student_enrollments 
    WHERE deleted_at IS NULL
  `);
  const totalRecords =
        parseInt(globalCount.rows[0].count);

  const hasFilters = Boolean(
    queryOptions.search ||
    queryOptions.student_id ||
    queryOptions.class_id ||
    queryOptions.section_id ||
    queryOptions.academic_session_id
    );


  return {
    data: result.rows,

    message: hasFilters
            ? `Showing ${filteredRecords} matching enrollments (${totalRecords} total)`
            : `Showing all ${totalRecords} enrollments`,
    
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
  } 
};
const updateEnrollment = async (id, data) => {
  const result = await db.query(
    `
    UPDATE student_enrollments
    SET
      student_id = $1,
      class_id = $2,
      section_id = $3,
      academic_session_id = $4,
      roll_number = $5,
      updated_at = NOW()
    WHERE id = $6 AND deleted_at IS NULL
    RETURNING *
    `,
    [
      id,
      data.student_id,
      data.class_id,
      data.section_id,
      data.academic_session_id,
      data.roll_number
    ]
  );

  return result.rows[0];
};
const deleteEnrollment = async (id) => {
  const result = await db.query(
    `
    UPDATE student_enrollments
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  enrollStudent,
  getEnrollments,
  updateEnrollment,
  deleteEnrollment
};