const db = require("../../config/db");
const teachersRepository = require("./teachers.repository");

const { buildWhereClause } = require("../../utils/queryBuilder");
const { buildPagination, buildPaginationMeta } = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

// CREATE — transaction 
const createTeacher = async (data) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        // 1. create user (login identity)
        const userResult = await teachersRepository.createUser(client, data);
        const user_id = userResult.rows[0].id;

        // 2. create teacher profile
        const result = await teachersRepository.createTeacher(client, user_id, data);

        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// GET ALL
const getAllTeachers = async (queryOptions) => {
    const { page, limit, offset } = buildPagination(queryOptions);

    const { sortBy, sortOrder } = buildOrder(queryOptions, {
        created_at:   "t.created_at",
        teacher_name: "u.full_name",
        email:        "u.email",
        designation:  "t.designation"
    });

    const values   = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "u.full_name",
            "u.email",
            "t.phone",
            "t.designation",
            "t.qualification"
        ],
        filterableColumns: [
            "t.designation",
            "u.gender"
        ]
    };

    const whereClause = buildWhereClause(queryOptions, values, config, countRef, "t");

    const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        teachersRepository.getAllTeachers({
            whereClause, sortBy, sortOrder, values, limit, offset, countRef
        }),
        teachersRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search      ||
        queryOptions.designation ||
        queryOptions.gender
    );

    return {
        data: rows,
        message: hasFilters
            ? `Showing ${filteredCount} matching teachers (${totalRecords} total)`
            : `Showing all ${totalRecords} teachers`,
        meta:       { totalRecords, filteredRecords: filteredCount, hasFilters },
        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const getTeacherById = async (id) => {
    const result = await teachersRepository.getTeacherById(id);
    if(!result){
        return null;
    }
    return result;
}

// UPDATE
const updateTeacher = async (id, data) => {
    const result = await teachersRepository.updateTeacher(id, data);
    if (!result) return null;
    return result;
};

// DELETE
const deleteTeacher = async (id) => {
    const result = await teachersRepository.deleteTeacher(id);
    if (!result) return null;
    return result;
};

module.exports = { createTeacher, getAllTeachers, getTeacherById, updateTeacher, deleteTeacher };