const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createRole = async (data) => {
  const result = await db.query(
    `
    INSERT INTO roles(name)
    VALUES($1)
    RETURNING *
    `,
    [data.name]
  );

  return result.rows[0];
};

const getRoles = async (queryOptions) => {

    // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);

    // sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, [
            "created_at",
            "name"
        ]);

    const values = [];
    const countRef = { value: 1 };

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
        FROM roles
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

    // FILTERED COUNT
    const totalQuery = `
        SELECT COUNT(*)
        FROM roles
        ${whereClause}
    `;

    const totalResult = await db.query(
        totalQuery,
        values.slice(0, values.length - 2)
    );

    const filteredRecords =
        parseInt(totalResult.rows[0].count);

    // GLOBAL COUNT
    const globalCountResult = await db.query(`
        SELECT COUNT(*)
        FROM roles
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.name
    );

    return {
        data: result.rows,

        message: hasFilters
            ? `Showing ${filteredRecords} matching roles (${totalRecords} total)`
            : `Showing all ${totalRecords} roles`,

        meta: {
            totalRecords,
            filteredRecords,
            hasFilters
        },

        pagination: buildPaginationMeta(
            filteredRecords,
            page,
            limit
        )
    };
};

const updateRole = async (id, data) => {
    const result = await db.query(
        ` 
    UPDATE roles
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
const deleteRole = async (id) => {
    const result = await db.query(
        `
    UPDATE roles
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};      

module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole
};