const buildWhereClause = (
    queryOptions,
    values,
    config,
    countRef,
    baseAlias = ""
) => {

    let where = baseAlias
        ? `WHERE ${baseAlias}.deleted_at IS NULL`
        : `WHERE deleted_at IS NULL`;

    // SEARCH
    if (queryOptions.search && config.searchableColumns?.length) {
        const searchConditions = config.searchableColumns.map((col) => {
            const param = `$${countRef.value}`;
            values.push(`%${queryOptions.search}%`);
            countRef.value++;
            return `${col} ILIKE ${param}`;
        });

        where += ` AND (${searchConditions.join(" OR ")})`;
    }

    // FILTER
    if (config.filterableColumns) {
        for (const key of config.filterableColumns) {
            if (queryOptions[key]) {
                where += ` AND ${key} = $${countRef.value}`;
                values.push(queryOptions[key]);
                countRef.value++;
            }
        }
    }

    return where;
};

module.exports = {
    buildWhereClause
};