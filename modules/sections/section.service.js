const sectionsRepository = require("./sections.repository");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createSection = async (data) => {
  const result = await sectionsRepository.createSection(data);
  return result;
};

const getSections = async (queryOptions) => {

    // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);

// sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, {
            created_at: "s.created_at",
            section_name: "s.name",
            class_name: "c.name"
        });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "s.name",
            "c.name"
        ],

        filterableColumns: [
            "s.class_id"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "s"
    ); 
    
const [{ rows, filteredCount }, totalRecords] = await Promise.all([
        sectionsRepository.getSections({
            whereClause,
            sortBy,
            sortOrder,
            values,
            limit,
            offset,
            countRef
        }),
        sectionsRepository.globalCount()
    ]);

    const hasFilters = Boolean(
        queryOptions.search   ||
        queryOptions.class_id
    );

    return {
        data: rows,

        message: hasFilters
            ? `Showing ${filteredCount} matching sections (${totalRecords} total)`
            : `Showing all ${totalRecords} sections`,

        meta: { totalRecords, filteredRecords: filteredCount, hasFilters },

        pagination: buildPaginationMeta(filteredCount, page, limit)
    };
};

const updateSection = async (id, data) => {
    const result = await sectionsRepository.updateSection(id, data);
    if (!result) return null;
    return result;
};
const deleteSection = async (id) => {
    const result = await sectionsRepository.deleteSection(id);
    if (!result) return null;
    return result;
};
module.exports = {
  createSection,
  getSections,
  updateSection,
  deleteSection,
};