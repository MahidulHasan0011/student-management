const rolesRepository = require("./roles.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createRole = async (data) => {
  const result = await rolesRepository.createRole(data);
  return result;
};

const getRoles = async (queryOptions) => {

    // pagination
    const { page, limit, offset } = buildPagination(queryOptions);

    // sorting
    const { sortBy, sortOrder } = buildOrder(queryOptions, {
          created_at: "created_at",
          name: "name"
});

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

const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        rolesRepository.getRoles({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        rolesRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.name
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching roles (${totalRecords} total)`
            : `Showing all ${totalRecords} roles`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updateRole = async (id, data) => {
    const result = await rolesRepository.updateRole(id, data);
    if (!result) return null;
    return result;
};

const deleteRole = async (id) => {
    const result = await rolesRepository.deleteRole(id);
    if (!result) return null;
    return result;
};
module.exports = {
  createRole,
  getRoles,
  updateRole,
  deleteRole
};