const service = require("./section.service");
const sendResponse = require("../../utils/response");

const createSection = async (req, res, next) => {
  try {
    const data = await service.createSection(req.body);
    return sendResponse(res, 201, "Section created", data);
  } catch (err) {
    next(err);
  }
};

const getSections = async (req, res, next) => {
  try {
    const data = await service.getSections();
    return sendResponse(res, 200, "Sections fetched", data);
  } catch (err) {
    next(err);
  }
};

const updateSection = async (req, res, next) => {
    try{
        const data = await service.updateSection(req.params.id, req.body);
        if(!data){
            return sendResponse(res, 404, "Section not found");
        }
        return sendResponse(res, 200, "Section updated successfully", data);
    }
    catch(error){
        next(error);
    }
}

const deleteSection = async (req, res, next) => {
  try {
    const data = await service.deleteSection(req.params.id);
    if(!data){
      return sendResponse(res, 404, "Section not found");
    }
    return sendResponse(res, 200, "Section deleted", data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSection,
  getSections,
  updateSection,
  deleteSection
};