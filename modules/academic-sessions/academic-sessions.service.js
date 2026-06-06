const db = require("../../config/db");
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
        ["created_at", "name", "start_date", "end_date"]
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

    // main query
    const query = `
         SELECT * FROM academic_sessions
         ${whereClause}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $${countRef.value} 
         OFFSET $${countRef.value + 1}`;

    values.push(limit, offset);
    const result = await db.query(query, values);

  
//    1

 // FILTERED COUNT (ONLY ONE COUNT NEEDED HERE)
   const totalQuery  =
   `SELECT COUNT(*)
    FROM academic_sessions
     ${whereClause}`;

    const totalResult = await db.query(
        totalQuery, 
        values.slice(0, values.length - 2)
    ); 
const filteredRecords = parseInt(
    totalResult.rows[0].count
);

// 2
// Global Count (WITHOUT ANY FILTERS, FOR PAGINATION PURPOSES)
const globalCountResult = await db.query(`
  SELECT COUNT(*)
  FROM academic_sessions
  WHERE deleted_at IS NULL
`);

const totalRecords = parseInt(globalCountResult.rows[0].count);


// 3
const hasFilters = Boolean(
    queryOptions.search ||
    queryOptions.name
);


  

    return {

        data: result.rows,

        message: hasFilters
      ? `Showing ${filteredRecords} matching sessions (${totalRecords} total)`
      : `Showing all ${totalRecords} sessions`,

        meta: {
            totalRecords,
            filteredRecords,
            hasFilters,
        },

        pagination: 
            buildPaginationMeta(
                filteredRecords,
                page,
                limit,
            ),  
    };
};
//update academic session
const updateSession = async (id, data) => {
    const query = `UPDATE academic_sessions 
                   SET name = $1, start_date = $2, end_date = $3, is_active = $4, updated_at=NOW()
                   WHERE id = $5 AND deleted_at IS NULL
                   RETURNING *`;
    const values = [data.name, data.start_date, data.end_date, data.is_active, id]; 
    const result = await db.query(query, values);
    return result.rows[0];
}  

//delete academic session by id (soft delete)
const deleteSession = async (id) => {
    const query = `UPDATE academic_sessions 
                   SET deleted_at = NOW()
                   WHERE id = $1 
                   RETURNING *`;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows[0];
}

module.exports = {
  createSession,
  getAllSessions,
  updateSession,
  deleteSession,
};