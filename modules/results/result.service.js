const examResultsRepository = require("./exam-results.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const addResult = async (data) => {
  const result = await examResultsRepository.addResult(data);
  return result;
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

 const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        examResultsRepository.getResults({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        examResultsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search     ||
        queryOptions.exam_id    ||
        queryOptions.student_id ||
        queryOptions.subject_id ||
        queryOptions.grade
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching results (${totalRecords} total)`
            : `Showing all ${totalRecords} results`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};


const updateResult = async (id, data) => {
    const result = await examResultsRepository.updateResult(id, data);
    if (!result) return null;
    return result;
};

const deleteResult = async (id) => {
    const result = await examResultsRepository.deleteResult(id);
    if (!result) return null;
    return result;
};


module.exports = {
  addResult,
  getResults,
  updateResult,
  deleteResult
};