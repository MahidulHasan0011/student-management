// simple table sorting
export const buildOrder = (
  queryOptions,
  allowedFields, // always Object only
  defaultField = 'created_at',
) => {
  // if queryOptions.sortBy is not in allowedFields → use the default
  const sortKey = allowedFields[queryOptions.sortBy] ? queryOptions.sortBy : defaultField;

  const sortBy = allowedFields[sortKey];

  const sortOrder = queryOptions.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return { sortBy, sortOrder };
};
