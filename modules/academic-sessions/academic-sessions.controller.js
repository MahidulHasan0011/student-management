const service = require("./academic-sessions.service");
const sendResponse = require("../../utils/response");
// CREATE
exports.createSession = async (req, res, next) => {
  try {
    const data = await service.createSession(req.body);
    return sendResponse(res, 201, "Session created", data);
  } catch (err) {
    next(err);
  }
};

// GET ALL
exports.getAllSessions = async (req, res, next) => {
  try {
    const result = await service.getAllSessions(req.query);
    return sendResponse(res, 200, result.message, {
        data: result.data,
        meta: result.meta,
        pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.updateSession = async (req, res, next) => {
  try {
    const data = await service.updateSession(req.params.id, req.body);
    return sendResponse(res, 200, "Session updated", data);
  } catch (err) {
    next(err);
  }
};

// DELETE
exports.deleteSession = async (req, res, next) => {
  try {
    const data = await service.deleteSession(req.params.id);
    return sendResponse(res, 200, "Session deleted", data);
  } catch (err) {
    next(err);
  }
};