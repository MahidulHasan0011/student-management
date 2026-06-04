const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createUser = async (data) => {
  const result = await db.query(
    `
    INSERT INTO users
    (
      full_name,
      email,
      password,
      role_id
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
    [
      data.full_name,
      data.email,
      data.password,
      data.role_id,
    ]
  );

  return result.rows[0];
};

const getUsers = async (queryOptions) => {

  // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);
    // sorting
    const { sortBy, sortOrder } =
      buildOrder(queryOptions, {
        created_at: "u.created_at",
        user_name: "u.full_name",
        user_email: "u.email",
        role_name: "r.name"
    });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
          "u.full_name",
          "u.email",
          "r.name"
        ],

        filterableColumns: [
          "u.role_id",
          "u.is_active"
        ]
    };
    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "u"
    );

        // MAIN QUERY
    const query = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.is_active,
            u.created_at,

            r.name AS role_name

        FROM users u

        LEFT JOIN roles r
            ON u.role_id = r.id

        ${whereClause}

        ORDER BY ${sortBy} ${sortOrder}

        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;
    values.push(limit, offset);

    const result = await db.query(query, values);

    // FILTERED COUNT
    const totalQuery = `
        SELECT COUNT(DISTINCT u.id)

        FROM users u

        LEFT JOIN roles r
            ON u.role_id = r.id

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
        FROM users
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.role_id ||
        queryOptions.is_active
    );

  return {
    data: result.rows,

    message: hasFilters
            ? `Showing ${filteredRecords} matching users (${totalRecords} total)`
            : `Showing all ${totalRecords} users`,

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
const updateUser = async (id, data) => {
    const result = await db.query(
        `
    UPDATE users
    SET
      full_name = $1,
        email = $2,
        password = $3,
        role_id = $4,
      updated_at = NOW()
    WHERE id = $5 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            data.full_name,
            data.email,
            data.password,
            data.role_id,
            id
        ]);
   return result.rows[0];
}; 
const deleteUser = async (id) => {
    const result = await db.query(
        `
    UPDATE users
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};      
        

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
};