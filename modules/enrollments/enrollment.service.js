const enrollmentsRepository = require("./enrollment.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const { buildPagination, buildPaginationMeta } = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const enrollStudent = async (data) => {
  const result = await enrollmentsRepository.enrollStudent(data);
  return result;
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


  const [{ rows, filteredCount }, totalRecords] = await Promise.all([
      enrollmentsRepository.getEnrollments({
          whereClause,
          sortBy,
          sortOrder,
          values,
          limit,
          offset,
          countRef
      }),
      enrollmentsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search               ||
        queryOptions.student_id           ||
        queryOptions.class_id             ||
        queryOptions.section_id           ||
        queryOptions.academic_session_id
    );

  return {
    data: rows,

    message: hasFilters
            ? `Showing ${filteredCount} matching enrollments (${totalRecords} total)`
            : `Showing all ${totalRecords} enrollments`,
    
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
  } 
};
const updateEnrollment = async (id, data) => {
 const result = await enrollmentsRepository.updateEnrollment(id, data);
    if (!result) return null;
    return result;
};
const deleteEnrollment = async (id) => {
 const result = await enrollmentsRepository.deleteEnrollment(id);
    if (!result) return null;
    return result;
};

module.exports = {
  enrollStudent,
  getEnrollments,
  updateEnrollment,
  deleteEnrollment
};