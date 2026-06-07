const academicSessionsRepository = require("./academic-sessions.repository");

const { buildWhereClause } = require("../../utils/queryBuilder");
const { buildPagination, buildPaginationMeta } = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

//create academic session
const createSession = async (data) => { 
const result = await academicSessionsRepository.createSession(data); 
   return result;  
}

//get all academic sessions
const getAllSessions = async (queryOptions) => {
    //pagination
    const { page, limit, offset } = buildPagination(queryOptions);

    //sorting
    const {sortBy, sortOrder} = buildOrder(
        queryOptions,
        {
            created_at: "created_at",
            name: "name",
            start_date: "start_date",
            end_date: "end_date"
        }
    );

    const values = [];
    const countRef = { value: 1 };
    // config
    const config = {
        searchableColumns: ["name"],
        filterableColumns: ["name"]
    };

    const whereClause = buildWhereClause(
        queryOptions, 
        values, 
        config, 
        countRef
    );


// pass parameter in service 
    const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        academicSessionsRepository.getAllSessions({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        academicSessionsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.name
    );

    return {

        data: rows,

        message: hasFilters
      ? `Showing ${filteredCount} matching sessions (${totalRecords} total)`
      : `Showing all ${totalRecords} sessions`,

        meta: {
            totalRecords,
            filteredCount,
            hasFilters,
        },

        pagination: 
            buildPaginationMeta(
                filteredCount,
                page,
                limit,
            ),  
    };
};

//update academic session
const updateSession = async (id, data) => {
    const result = await academicSessionsRepository.updateSession(id,data);
    if(!result) return null;
    return result;  
}  

//delete academic session by id (soft delete)
const deleteSession = async (id) => {
    const result = await academicSessionsRepository.deleteSession(id);
    if(!result) return null;
    return result;
}

module.exports = {
  createSession,
  getAllSessions,
  updateSession,
  deleteSession,
};