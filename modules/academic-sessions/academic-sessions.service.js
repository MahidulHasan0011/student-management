const db = require("../../config/db");

//create academic session
const createSession = async (data) => {
    const query = `INSERT INTO academic_sessions (name, start_date, end_date,is_active) 
    VALUES ($1, $2, $3, $4)
     RETURNING *`;

   const values = [data.name, data.start_date, data.end_date, data.is_active];
   const result = await db.query(query, values);
   return result.rows[0];  
}
// shared search/filter builder
const buildWhereClause = (queryOptions, values, countRef) => {
    let where = "WHERE deleted_at IS NULL";

    if (queryOptions.search) {
        where += ` AND name LIKE $${countRef.value}`;
        values.push(`%${queryOptions.search}%`);
        countRef.value++;
    }

    if (queryOptions.name) {
        where += ` AND name = $${countRef.value}`;
        values.push(queryOptions.name);
        countRef.value++;
    }

    return where;
};

//get all academic sessions
const getAllSessions = async (queryOptions) => {
    //pagination
    const page = parseInt(queryOptions.page) || 1;
    const limit = parseInt(queryOptions.limit) || 10;
    const skip = (page - 1) * limit;

    // allowed sort fields
    const allowedSortFields = [
        "created_at",
        "name",
        "start_date",
        "end_date"
    ];

    //sorting
    const sortBy = allowedSortFields.includes(queryOptions.sortBy) ? queryOptions.sortBy : "created_at";
    const sortOrder = queryOptions.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const values = [];
    const countRef = { value: 1 };
    const whereClause = buildWhereClause(queryOptions, values, countRef);

    // main query
    const query = `SELECT * FROM academic_sessions
                   ${whereClause}
                   ORDER BY ${sortBy} ${sortOrder}
                   LIMIT $${countRef.value} OFFSET $${countRef.value + 1}`;

    values.push(limit, skip);
    const result = await db.query(query, values);

    // total count query (reuse where clause with matching values)
    const totalQuery = `SELECT COUNT(*)
                        FROM academic_sessions
                        ${whereClause}`;
    const totalResult = await db.query(totalQuery, values.slice(0, values.length - 2));

    return {
        data: result.rows,
        pagination: {
            total: parseInt(totalResult.rows[0].count),
            page, limit,
            totalPages: Math.ceil(
                totalResult.rows[0].count / limit
            ),
        },
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