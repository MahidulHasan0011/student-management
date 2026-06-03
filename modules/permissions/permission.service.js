const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createPermission = async (data) => {
  const result = await db.query(
    `
    INSERT INTO permissions(name)
    VALUES($1)
    RETURNING *
    `,
    [data.name]
  );

  return result.rows[0];
};
const getPermissions = async (queryOptions) => {
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
    FROM permissions
    ${whereClause} 
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${countRef.value}
    OFFSET $${countRef.value + 1}`;

    values.push(limit, offset);

    const result = await db.query(query,values);

  // total count
    const totalQuery = `
    SELECT COUNT(*)
    FROM permissions
    ${whereClause}`;
    
    const totalResult = await db.query(
        totalQuery, 
        values.slice(0, values.length - 2)
    );
    const filteredRecords = parseInt(totalResult.rows[0].count);
  // Global Count (WITHOUT ANY FILTERS, FOR PAGINATION PURPOSES)
  const globalCountResult = await db.query(`
    SELECT COUNT(*)
    FROM permissions
    WHERE deleted_at IS NULL
  `);

  const totalRecords = parseInt(globalCountResult.rows[0].count);
  const hasFilters = Boolean(
    queryOptions.search ||
    queryOptions.name
  );

  return{
        data:result.rows,
       
        message: hasFilters
      ? `Showing ${filteredRecords} matching permissions (${totalRecords} total)`
      : `Showing all ${totalRecords} permissions`,

      
        meta: {
            totalRecords,
            filteredRecords,
            hasFilters,
        },

        pagination: buildPaginationMeta(
            filteredRecords,
            page, 
            limit
        )
  }
};
const updatePermission = async (id, data) => {
    const result = await db.query(
        ` 
    UPDATE permissions
    SET
      name = $1,
      updated_at = NOW()
    WHERE id = $2 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            data.name,
            id
        ]);
   return result.rows[0];
}; 
const deletePermission = async (id) => {
    const result = await db.query(
        `
    UPDATE permissions
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};      

module.exports = {
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission
};