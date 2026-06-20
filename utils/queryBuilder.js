// WHERE clause builder — soft delete + search + filter
//
// config.filterableColumns এখন দুই ফরম্যাট নেয়:
//   ["status"]                          → query param ও SQL column একই নাম
//   [{ param: "role_id", column: "u.role_id" }]  → alias সহ SQL column হলে এভাবে দিতে হবে
export const buildWhereClause = (
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
    for (const entry of config.filterableColumns) {
      // string দিলে param নাম ও column নাম একই ধরে নেওয়া হয়
      const { param, column } =
        typeof entry === "string" ? { param: entry, column: entry } : entry;

      if (queryOptions[param] !== undefined && queryOptions[param] !== "") {
        where += ` AND ${column} = $${countRef.value}`;
        values.push(queryOptions[param]);
        countRef.value++;
      }
    }
  }

  return where;
};