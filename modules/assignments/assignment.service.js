const db = require("../../config/db");
const subjectAssignmentsRepository = require("./assignments.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const assignSubject = async (data) => {
  const result = await subjectAssignmentsRepository.assignSubject(data);
  return result;
};

const getAssignments = async (queryOptions) => {
  //pagination
  const { page, limit, offset } = buildPagination(queryOptions);
    //sorting
  const {sortBy, sortOrder} = buildOrder(queryOptions,{
    created_at: "sa.created_at", 
    teacher_name: "u.full_name",
    teacher_email: "u.email",
    class_name: "c.name", 
    section_name: "s.name", 
    subject_name: "sub.name",
    session_name: "ac.name"
  });
  const values = [];
  const countRef = { value: 1 };
  const config = {
    searchableColumns: [
      "u.full_name",
      "u.email",
      "c.name",
      "s.name",
      "sub.name",
      "ac.name"
    ],

    filterableColumns: [
      "sa.teacher_id",
      "sa.class_id",
      "sa.section_id",
      "sa.subject_id",
      "sa.academic_session_id"
    ]
  };
const whereClause = buildWhereClause(
    queryOptions,
    values,
    config,
    countRef,
    "sa"
)
const hasSearch = Boolean(queryOptions.search);


 // Service receive parameter 
    const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        subjectAssignmentsRepository.getAssignments({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef,
            hasSearch  //  repository knows about count query
        }),
        subjectAssignmentsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search               ||
        queryOptions.teacher_id           ||
        queryOptions.class_id             ||
        queryOptions.section_id           ||
        queryOptions.subject_id           ||
        queryOptions.academic_session_id
    );


  return {
    data: rows,
        
     message: hasFilters
      ? `Showing ${filteredCount} matching assignments (${totalRecords} total)`
      : `Showing all ${totalRecords} assignments`,

  

      meta: {
      totalRecords,
      filteredCount,
      hasFilters,
    },

        pagination: buildPaginationMeta(
            filteredCount,
            page, 
            limit
        ),
  } 
};

const updateAssignment = async (id, data) => {
    const result = await subjectAssignmentsRepository.updateAssignment(id, data);
    if (!result) return null;
    return result;
};

// DELETE
const deleteAssignment = async (id) => {
    const result = await subjectAssignmentsRepository.deleteAssignment(id);
    if (!result) return null;
    return result;
};


module.exports = {
  assignSubject,
  getAssignments,
  updateAssignment,
  deleteAssignment
};