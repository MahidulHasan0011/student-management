const classesRepository = require("./classes.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createClass = async (data) => {
    const result = await classesRepository.createClass(data);
    return result;
};
const getAllClasses = async (queryOptions) => {
    //pagination
    const { page, limit, offset } = buildPagination(queryOptions);

    //sorting
    const {sortBy, sortOrder} = buildOrder(
        queryOptions,
        {
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
        classesRepository.getAllClasses({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        classesRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.name
    );
    return {
        data:rows,
       
        message: hasFilters
      ? `Showing ${filteredCount} matching classes (${totalRecords} total)`
      : `Showing all ${totalRecords} classes`,

      
        meta: {
            totalRecords,
            filteredCount,
            hasFilters,
        },

        pagination: buildPaginationMeta(
            filteredCount,
            page, 
            limit
        )
    };
};
const updateClass = async(id, data) => {
    const result = await classesRepository.updateClass(id, data);
    if (!result) return null;
    return result;
};
const deleteClass = async (id) => {
      const result = await classesRepository.deleteClass(id);
    if (!result) return null;
    return result;
};

module.exports = {
    createClass,
    getAllClasses,
    updateClass,
    deleteClass
};