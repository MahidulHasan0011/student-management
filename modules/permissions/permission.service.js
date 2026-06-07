const permissionsRepository = require("./permissions.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createPermission = async (data) => {
  const result = await permissionsRepository.createPermission(data);
  return result;
};

const getPermissions = async (queryOptions) => {
      //pagination
    const { page, limit, offset } = buildPagination(queryOptions);
    //sorting
    const {sortBy, sortOrder} = buildOrder(
        queryOptions, {
          created_at: "created_at",
          name: "name"
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

 const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        permissionsRepository.getPermissions({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        permissionsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.name
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching permissions (${totalRecords} total)`
            : `Showing all ${totalRecords} permissions`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updatePermission = async (id, data) => {
    const result = await permissionsRepository.updatePermission(id, data);
    if (!result) return null;
    return result;
};

const deletePermission = async (id) => {
    const result = await permissionsRepository.deletePermission(id);
    if (!result) return null;
    return result;
};     

module.exports = {
  createPermission,
  getPermissions,
  updatePermission,
  deletePermission
};