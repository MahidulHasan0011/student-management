const teachersRepository = require("./teachers.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createTeacher = async (data) => {
    const result = await teachersRepository.createTeacher(data);
    return result;
};
const getAllTeachers = async (queryOptions) => {

    // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);

    // sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, {
            created_at: "t.created_at",
            teacher_name: "u.full_name",
            email: "u.email",
            designation: "t.designation"
        });

    const values = [];
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
            "t.designation"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "t"
    );
const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        teachersRepository.getAllTeachers({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        teachersRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search      ||
        queryOptions.designation
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching teachers (${totalRecords} total)`
            : `Showing all ${totalRecords} teachers`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updateTeacher = async (id, data) => {
    const result = await teachersRepository.updateTeacher(id, data);
    if (!result) return null;
    return result;
};
const deleteTeacher = async (id) => {
    const result = await teachersRepository.deleteTeacher(id);
    if (!result) return null;
    return result;
};

module.exports = {
    createTeacher,
    getAllTeachers,
    updateTeacher,
    deleteTeacher
};