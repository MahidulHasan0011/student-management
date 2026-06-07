const db = require("../../config/db");
const studentRepository = require("./students.repository");

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

        // START TRANSACTION
        await client.query("BEGIN");

        // 1. create user (login identity)
        const userResult = await studentRepository.createUser
        (
            client, 
            data
        );
        const user_id = userResult.rows[0].id;

        // 2. create student profile
        const result = await studentRepository.createStudent
        (
            client, 
            user_id, 
            data
        );
       // SUCCESS → COMMIT
        await client.query("COMMIT");
        return result;
    } catch (error) {
        //  ERROR → ROLLBACK
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
            student_name: "u.full_name",
            student_code: "st.student_code",
            class_name: "c.name",
            section_name: "s.name"
        });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "u.full_name",  
            "u.email",       
            "st.student_code",
            "st.guardian_name",
            "st.guardian_phone",
            "c.name",
            "s.name"
        ],

        filterableColumns: [
            "u.gender",
            "se.class_id",
            "se.section_id",
            "se.academic_session_id"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions, values, config, countRef, "st"
    );

const [{rows, filteredCount }, totalRecords] = await Promise.all([
    studentRepository.getAllStudents({
        whereClause,
        sortBy,
        sortOrder,
        values,
        limit,
        offset,
        countRef
    }),
    studentRepository.globalCount()
]);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.gender ||
        queryOptions.class_id ||
        queryOptions.section_id ||
        queryOptions.academic_session_id

    );

   return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching students (${totalRecords} total)`
            : `Showing all ${totalRecords} students`,

        meta: {
            totalRecords,
            filteredCount,
            hasFilters
        },

        pagination: buildPaginationMeta(
            filteredCount,
            page,
            limit
        )
    };
}
//GET BY ID
const getStudentById = async (id) => {
    const result = await studentRepository.getStudentById(id);
    if(!result){
        return null;
    }
    return result;
}
//update student
const updateStudent = async (id, data) => {
    const result = await studentRepository.updateStudent(id, data);
    if(!result){
        return null;
    }  
    return result;

    
   
};
// delete student by id (soft delete)
const deleteStudent = async (id) => {
    const result = await studentRepository.deleteStudent(id);
    if(!result){
        return null;
    }
    return result;
}


module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };