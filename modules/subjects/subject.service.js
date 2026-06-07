const subjectsRepository = require("./subjects.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createSubject = async (data) => {
    const result = await subjectsRepository.createSubject(data);
    return result;
};
const getAllSubjects = async (queryOptions) => {


 // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);

    // sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, {
            created_at: "sub.created_at",
            subject_name: "sub.name",
            subject_code: "sub.code"
        });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "sub.name",
            "sub.code"
        ],

        filterableColumns: [
            "sub.code"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "sub"
    );
 const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        subjectsRepository.getAllSubjects({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        subjectsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.code
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching subjects (${totalRecords} total)`
            : `Showing all ${totalRecords} subjects`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updateSubject = async (id, data) => {
    const result = await subjectsRepository.updateSubject(id, data);
    if (!result) return null;
    return result;
};
const deleteSubject = async (id) => {
    const result = await subjectsRepository.deleteSubject(id);
    if (!result) return null;
    return result;
};

module.exports = {
    createSubject,
    getAllSubjects,
    updateSubject,
    deleteSubject
};