const service = require("./result.service");
const sendResponse = require("../../utils/response");

const createResult = async (req, res, next) => {
  try {
    const data = await service.addResult(req.body);

    return sendResponse(
      res,
      201,
      "Result created successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getResults = async (req, res, next) => {
  try {
    const data = await service.getResults();

    return sendResponse(
      res,
      200,
      "Results fetched",
      data
    );
  } catch (err) {
    next(err);
  }
};

const updateResult = async (req, res, next) => {
  try {
    const data = await service.updateResult(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Result not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Result updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteResult = async (req, res, next) => {
  try {
    const data = await service.deleteResult(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Result not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Result deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createResult,
  getResults,
  updateResult,
  deleteResult
};