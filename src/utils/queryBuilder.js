// WHERE clause builder — soft delete + search + filter
//
// config.filterableColumns now takes two formats:
//   ["status"]                          → query param and SQL column have the same name
//   [{ param: "role_id", column: "u.role_id" }]  → use this form when the SQL column has an alias
export const buildWhereClause = (queryOptions, values, config, countRef, baseAlias = '') => {
  let where = baseAlias ? `WHERE ${baseAlias}.deleted_at IS NULL` : `WHERE deleted_at IS NULL`;

  // SEARCH
  if (queryOptions.search && config.searchableColumns?.length) {
    const searchConditions = config.searchableColumns.map((col) => {
      const param = `$${countRef.value}`;
      values.push(`%${queryOptions.search}%`);
      countRef.value++;
      return `${col} ILIKE ${param}`;
    });

    where += ` AND (${searchConditions.join(' OR ')})`;
  }

  // FILTER
  if (config.filterableColumns) {
    for (const entry of config.filterableColumns) {
      // if given a string, the param name and column name are assumed to be the same
      const { param, column } = typeof entry === 'string' ? { param: entry, column: entry } : entry;

      if (queryOptions[param] !== undefined && queryOptions[param] !== '') {
        where += ` AND ${column} = $${countRef.value}`;
        values.push(queryOptions[param]);
        countRef.value++;
      }
    }
  }

  return where;
};
