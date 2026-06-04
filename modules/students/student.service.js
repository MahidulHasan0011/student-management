const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const { buildPagination, buildPaginationMeta } = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");




const createStudent = async (data) => {
    const client = await db.connect();

    // Teacher Request
    //       ↓
    // START TRANSACTION
    //       ↓
    // Create User (login)
    //       ↓
    // Create Student Profile
    //       ↓
    // COMMIT (SAVE ALL)
    //       ↓
    // Response success


    try {
        await client.query("BEGIN");

        // 1. create user (login identity)
        const userResult = await client.query(
            `
      INSERT INTO users
      (full_name, email, password, role_id)
      VALUES ($1,$2,$3,$4)
      RETURNING id
      `,
            [
                data.full_name,
                data.email,
                data.password, // already hashed
                data.role_id // STUDENT role
            ]
        );

        const user_id = userResult.rows[0].id;

        // 2. create student profile
        const studentResult = await client.query(
            `
      INSERT INTO students
      (
        user_id,
        student_code,
        gender,
        date_of_birth,
        guardian_name,
        guardian_phone,
        address
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
            [
                user_id,
                data.student_code,
                data.gender,
                data.date_of_birth,
                data.guardian_name,
                data.guardian_phone,
                data.address
            ]
        );

        await client.query("COMMIT");

        return studentResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Get all students
const getAllStudents = async (queryOptions) => {
    // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);
    // sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, {
            created_at: "st.created_at",
            student_name: "st.full_name",
            student_code: "st.student_code",
            class_name: "c.name",
            section_name: "s.name"
        });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "st.full_name",
            "st.student_code",
            "st.guardian_name",
            "st.guardian_phone",
            "c.name",
            "s.name"
        ],

        filterableColumns: [
            "st.gender",
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
        "st"
    );

    // MAIN QUERY
    const query = `
        SELECT
            st.*,

            se.roll_number,

            c.name AS class_name,
            s.name AS section_name,
            ac.name AS session_name

        FROM students st

        LEFT JOIN student_enrollments se
            ON st.id = se.student_id

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
        SELECT COUNT(DISTINCT st.id)

        FROM students st

        LEFT JOIN student_enrollments se
            ON st.id = se.student_id

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

    const globalCountResult = await db.query(`
        SELECT COUNT(*)
        FROM students
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.gender ||
        queryOptions.class_id ||
        queryOptions.section_id
    );
    return {
        data: result.rows,

        message: hasFilters
            ? `Showing ${filteredRecords} matching students (${totalRecords} total)`
            : `Showing all ${totalRecords} students`,

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
}
//GET BY ID
const getStudentById = async (id) => {
    const query = `SELECT * FROM students
                   WHERE id = $1 AND deleted_at IS NULL`;
    const result = await db.query(query, [id]);
    return result.rows[0];
}
//update student
const updateStudent = async (id, data) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");
        const student = await client.query(
            `
            UPDATE students
            SET
            full_name = COALESCE($1, full_name),
            gender = COALESCE($2, gender),
            guardian_name = COALESCE($3, guardian_name),
            guardian_phone = COALESCE($4, guardian_phone),
            address = COALESCE($5, address),
            updated_at = NOW()
        WHERE id = $6 AND deleted_at IS NULL
        RETURNING *`,
            [
                data.full_name,
                data.gender,
                data.guardian_name,
                data.guardian_phone,
                data.address,
                id
            ]
        );
        await client.query("COMMIT");
        return student.rows[0];

    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
// delete student by id (soft delete)
const deleteStudent = async (id) => {
    const query = `UPDATE students
                   SET deleted_at = NOW()
                   WHERE id = $1 
                   RETURNING *`;
    const result = await bd.query(query, [id]);
    return result.rows[0];
}


module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };