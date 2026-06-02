const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createClass = async (data) => {
    const query = `INSERT INTO classes (name) VALUES ($1) RETURNING *`;
    const values = [data.name];
    const result = await db.query(query, values);
    return result.rows[0];
};
const getAllClasses = async (queryOptions) => {
    //pagination
    const { page, limit, offset } = buildPagination(queryOptions);

    //sorting
    const {sortBy, sortOrder} = buildOrder(
        queryOptions,
        ["created_at", "name"]
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
    
   // MAIN QUERY
    const query = `
    SELECT * 
    FROM classes
    ${whereClause} 
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${countRef.value}
    OFFSET $${countRef.value + 1}`;

    values.push(limit, offset);

    const result = await db.query(query,values);

//   1
    // total count
    const totalQuery = `
    SELECT COUNT(*)
    FROM classes
    ${whereClause}`;
    
    const totalResult = await db.query(
        totalQuery, 
        values.splice(0, values.length - 2)
    );
    const filteredRecords = parseInt(totalResult.rows[0].count);

    // 2
    // Global Count (WITHOUT ANY FILTERS, FOR PAGINATION PURPOSES)
const globalCountResult = await db.query(`
  SELECT COUNT(*)
  FROM classes
  WHERE deleted_at IS NULL
`);

const totalRecords = parseInt(globalCountResult.rows[0].count);

// 3
const hasFilters = Boolean(
    queryOptions.search ||
    queryOptions.name
);

    return {
        data:result.rows,
       
        message: hasFilters
      ? `Showing ${filteredRecords} matching classes (${totalRecords} total)`
      : `Showing all ${totalRecords} classes`,

      
        meta: {
            totalRecords,
            filteredRecords,
            hasFilters,
        },

        pagination: buildPaginationMeta(
            filteredRecords,
            page, 
            limit
        ),
    };
};
const updateClass = async(id, data) => {
    const result = await db.query(`UPDATE classes SET name = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *`, [data.name, id]);
    return result.rows[0];
};
const deleteClass = async (id) => {
    const result = await db.query(`UPDATE classes SET deleted_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
};

module.exports = {
    createClass,
    getAllClasses,
    updateClass,
    deleteClass
};