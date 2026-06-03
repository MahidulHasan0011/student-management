const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createSection = async (data) => {
  const result = await db.query(
    `
    INSERT INTO sections (class_id, name)
    VALUES ($1, $2)
    RETURNING *
    `,
    [data.class_id, data.name]
  );

  return result.rows[0];
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
    

     // MAIN QUERY
    const query = `
        SELECT
            s.*,
            c.name AS class_name

        FROM sections s

        LEFT JOIN classes c
            ON s.class_id = c.id

        ${whereClause}

        ORDER BY ${sortBy} ${sortOrder}

        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

     // COUNT QUERY
    const totalQuery = `
        SELECT COUNT(DISTINCT s.id)

        FROM sections s

        LEFT JOIN classes c
            ON s.class_id = c.id

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
        FROM sections
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.class_id
    );

  return {
    data: result.rows,

        message: hasFilters
            ? `Showing ${filteredRecords} matching sections (${totalRecords} total)`
            : `Showing all ${totalRecords} sections`,

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

const updateSection = async (id, data) => {
  const result = await db.query(
    `
    UPDATE sections
    SET 
    class_id = $1,
    name = $2, 
    updated_at = NOW()
    WHERE id = $3 AND deleted_at IS NULL
    RETURNING *
    `,
    [data.class_id, data.name, id]
  );
    return result.rows[0];
};
const deleteSection = async (id) => {
  const result = await db.query(
    `
    UPDATE sections
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createSection,
  getSections,
  updateSection,
  deleteSection,
};