const examsRepository = require("./exam.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination,buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createExam = async (data) => {
    const result = await examsRepository.createExam(data);
    return result;
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
const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        examsRepository.getExams({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        examsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search               ||
        queryOptions.class_id             ||
        queryOptions.academic_session_id  ||
        queryOptions.exam_date            ||
        queryOptions.exam_type
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching exams (${totalRecords} total)`
            : `Showing all ${totalRecords} exams`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updateExam = async (id, data) => {
    const result = await examsRepository.updateExam(id, data);
    if (!result) return null;
    return result;
};

const deleteExam = async (id) => {
    const result = await examsRepository.deleteExam(id);
    if (!result) return null;
    return result;
};
module.exports = {
    createExam,
    getExams,
    updateExam,
    deleteExam
};