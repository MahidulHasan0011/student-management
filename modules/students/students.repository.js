const db = require("../../config/db");


const createUser = async (client, data) => {
    return await client.query(
        `
        INSERT INTO users
        (full_name, email, password, role_id, gender)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id
        `,
        [
            data.full_name,
            data.email,
            data.password, 
            data.role_id,
            data.gender
        ]
    );
};

const createStudent = async (client, user_id, data) => {
    const result = await client.query(
        `
        INSERT INTO students
        (
            user_id, 
            student_code,  
            date_of_birth, 
            guardian_name, 
            guardian_phone, 
            address
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
            user_id,
            data.student_code,
            data.date_of_birth,
            data.guardian_name,
            data.guardian_phone,
            data.address
        ]
    );
    return result.rows[0];
};


const getAllStudents = async ({  
        whereClause,
        sortBy,
        sortOrder,
        values,
        limit,
        offset,
        countRef}) => {

    const baseJoins = `
        FROM students st
        LEFT JOIN users u                ON st.user_id = u.id   
        LEFT JOIN student_enrollments se ON st.id = se.student_id
        LEFT JOIN classes c              ON se.class_id = c.id
        LEFT JOIN sections s             ON se.section_id = s.id
        LEFT JOIN academic_sessions ac   ON se.academic_session_id = ac.id
        ${whereClause}
    `;
    const mainQuery = `
        SELECT
            st.*,
            u.full_name,
            u.email,
            u.gender,
            u.is_active,
            se.roll_number,
            c.name  AS class_name,
            s.name  AS section_name,
            ac.name AS session_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;
    const countQuery = `
        SELECT COUNT(DISTINCT st.id)
        ${baseJoins}
    `;
    const filterValues = [...values];// without LIMIT/OFFSET values
   
    const mainValues   = [...values, limit, offset];  // with LIMIT/OFFSET values
   
    const [dataResult, countResult] = await Promise.all([
        db.query(mainQuery, mainValues),
        db.query(countQuery, filterValues)
    ]);

    return {
        rows: dataResult.rows,
        filteredCount: parseInt(countResult.rows[0].count)
    };
};

const globalCount = async () => {
      const result = await db.query(`
        SELECT COUNT(*)
        FROM students
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

const getStudentById = async (id) => {
    const result = await db.query(
        `SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`,
        [id]
    );
    return result.rows[0];
};

// Fix — দুইটা table আলাদা update
const updateStudent = async (id, data) => {
    const studentResult  = await db.query(
        `
        UPDATE students
        SET
            guardian_name = COALESCE($1, guardian_name),
            guardian_phone = COALESCE($2, guardian_phone),
            address = COALESCE($3, address),
            updated_at = NOW()
        WHERE id = $4 AND deleted_at IS NULL
        RETURNING *
        `,
        [
            data.guardian_name,
            data.guardian_phone,
            data.address,
            id
        ]
    );
    if (!studentResult.rows[0]) return null;

 // 2. users table update — user_id দিয়ে
    await db.query(
        `UPDATE users
         SET
             full_name  = COALESCE($1, full_name),
             gender     = COALESCE($2, gender),
             updated_at = NOW()
         WHERE id = (
             SELECT user_id FROM students WHERE id = $3
         )`,
        [
            data.full_name,
            data.gender,
            id
        ]
    );



    return studentResult.rows[0];
};

const deleteStudent = async (id) => {
    const result = await db.query(
        `UPDATE students SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = {
    createUser,
    createStudent,
    getAllStudents,
    globalCount,
    getStudentById,
    updateStudent,
    deleteStudent
};