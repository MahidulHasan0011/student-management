const service = require("./enrollment.service");
const sendResponse = require("../../utils/response");

const assignEnrollment = async (req, res, next) => {
  try {
    const data = await service.enrollStudent(req.body);

    return sendResponse(
      res,
      201,
      "Enrollment assigned successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getEnrollments = async (req, res, next) => {
  try {
    const result = await service.getEnrollments( req.query );

    return sendResponse(
      res,
      200,
      result.message,
      {
        data: result.data,
        meta: result.meta,
        pagination: result.pagination
      }
    );
  } catch (err) {
    next(err);
  }
};

const updateEnrollment = async (req, res, next) => {
  try {
    const data = await service.updateEnrollment(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Enrollment not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Enrollment updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteEnrollment = async (req, res, next) => {
  try {
    const data = await service.deleteEnrollment(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Enrollment not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Enrollment deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  assignEnrollment,
  getEnrollments,
  updateEnrollment,
  deleteEnrollment
}