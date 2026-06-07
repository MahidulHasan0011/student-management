const usersRepository = require("./users.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createUser = async (data) => {
  const result = await usersRepository.createUser(data);
  return result;
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
const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        usersRepository.getUsers({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        usersRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search    ||
        queryOptions.role_id   ||
        queryOptions.is_active
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching users (${totalRecords} total)`
            : `Showing all ${totalRecords} users`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updateUser = async (id, data) => {
    const result = await usersRepository.updateUser(id, data);
    if (!result) return null;
    return result;
}; 
const deleteUser = async (id) => {
    const result = await usersRepository.deleteUser(id);
    if (!result) return null;
    return result;
};     
        

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser
};