const rolePermissionsRepository = require("./role-permissions.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const assignRolePermission = async (data) => {
  const result = await rolePermissionsRepository.assignRolePermission(data);
  return result;
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
 const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        rolePermissionsRepository.getRolePermissions({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        rolePermissionsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search        ||
        queryOptions.role_id       ||
        queryOptions.permission_id
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching role permissions (${totalRecords} total)`
            : `Showing all ${totalRecords} role permissions`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};
const updateRolePermission = async (id, data) => {
    const result = await rolePermissionsRepository.updateRolePermission(id, data);
    if (!result) return null;
    return result;
};
const deleteRolePermission = async (id) => {
    const result = await rolePermissionsRepository.deleteRolePermission(id);
    if (!result) return null;
    return result;
};

module.exports = {
  assignRolePermission,
  getRolePermissions,
  updateRolePermission,
  deleteRolePermission
};
