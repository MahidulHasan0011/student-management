const service = require("./assignment.service");
const sendResponse = require("../../utils/response");

const assignSubject = async (req, res, next) => {
  try {
    const data = await service.assignSubject(req.body);

    return sendResponse(
      res,
      201,
      "Subject assigned successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const data = await service.getAssignments(req.query);

    return sendResponse(
      res,
      200,
      "Assignments fetched",
      data
    );
  } catch (err) {
    next(err);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const data = await service.updateAssignment(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Assignment not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Assignment updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const data = await service.deleteAssignment(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Assignment not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Assignment deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  assignSubject,
  getAssignments,
  updateAssignment,
  deleteAssignment
};