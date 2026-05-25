const service = require("./exam.service");
const sendResponse = require("../../utils/response");

const createExam = async (req, res, next) => {
  try {
    const data = await service.createExam(req.body);

    return sendResponse(
      res,
      201,
      "Exam created successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};

const getExams = async (req, res, next) => {
  try {
    const data = await service.getExams();

    return sendResponse(
      res,
      200,
      "Exams fetched",
      data
    );
  } catch (err) {
    next(err);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const data = await service.updateExam(req.params, req.body);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Exam not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Exam updated",
      data
    );
  } catch (err) {
    next(err);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const data = await service.deleteExam(req.params);
    if(!data) {
      return sendResponse(
        res,
        404,
        "Exam not found"
      );
    }

    return sendResponse(
      res,
      200,
      "Exam deleted",
      data
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createExam,
  getExams,
  updateExam,
  deleteExam
};