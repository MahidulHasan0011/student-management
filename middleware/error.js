const errorHandler = (err, req, res, next) => {
  console.error(err);

  // POSTGRES DUPLICATE ERROR
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Duplicate value error",
      error: err.detail,
    });
  }

  // INVALID UUID
  if (err.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid UUID format",
    });
  }

  // DEFAULT ERROR
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;