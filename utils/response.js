export const successResponse = (res, { message = "Success", data = null, meta = null, statusCode = 200 } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const errorResponse = (res, { message = "Something went wrong", errors = null, statusCode = 500 } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};