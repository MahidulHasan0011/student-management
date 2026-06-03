const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const assignRolePermission = async (data) => {
  const result = await db.query(
    `
    INSERT INTO role_permissions
    (role_id, permission_id)
    VALUES($1,$2)
    RETURNING *
    `,
    [
      data.role_id,
      data.permission_id,
    ]
  );

  return result.rows[0];
};
const getRolePermissions = async (queryOptions) => {
  const { page, limit, offset } = buildPagination(queryOptions);
  const { sortBy, sortOrder } = buildOrder(queryOptions, {
        created_at: "rp.created_at",
        role_name: "r.name",
        permission_name: "p.name"
  });
 const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "r.name",
            "p.name"
        ],

        filterableColumns: [
            "rp.role_id",
            "rp.permission_id"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "rp"
    );

    // MAIN QUERY
    const query = `
        SELECT
            rp.*,

            r.name AS role_name,
            p.name AS permission_name

        FROM role_permissions rp

        LEFT JOIN roles r
            ON rp.role_id = r.id

        LEFT JOIN permissions p
            ON rp.permission_id = p.id

        ${whereClause}

        ORDER BY ${sortBy} ${sortOrder}

        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

    // COUNT
    const totalQuery = `
        SELECT COUNT(DISTINCT rp.id)

        FROM role_permissions rp

        LEFT JOIN roles r
            ON rp.role_id = r.id

        LEFT JOIN permissions p
            ON rp.permission_id = p.id

        ${whereClause}
    `;

    const totalResult = await db.query(
        totalQuery,
        values.slice(0, values.length - 2)
    );

    const filteredRecords =
        parseInt(totalResult.rows[0].count);

    const globalCountResult = await db.query(`
        SELECT COUNT(*)
        FROM role_permissions
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.role_id ||
        queryOptions.permission_id
    );
  return{
     data: result.rows,

        message: hasFilters
            ? `Showing ${filteredRecords} matching role permissions (${totalRecords} total)`
            : `Showing all ${totalRecords} role permissions`,

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
  }
};
const updateRolePermission = async (id, data) => {
    const result = await db.query(
        `
    UPDATE role_permissions
    SET
    role_id = $1,
    permission_id = $2
    WHERE id = $3 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            data.role_id,
            data.permission_id,
            id
        ]);
   return result.rows[0];
}; 
const deleteRolePermission = async (id) => {
    const result = await db.query(
        `
    UPDATE role_permissions
    SET
    deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]);
   return result.rows[0];
};

module.exports = {
  assignRolePermission,
  getRolePermissions,
  updateRolePermission,
  deleteRolePermission
};
