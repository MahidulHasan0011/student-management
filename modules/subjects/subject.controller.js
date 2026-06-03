const service = require('./subject.service');
const sendResponse = require("../../utils/response");

const createSubject = async (req, res, next) => {
    try {
       const data = await service.createSubject(req.body);
       return sendResponse(res, 201,"Subject created", data);
    } catch (error) {
        next(error);
    }
};

const getSubjects = async (req, res, next) => {
    try {
        const data = await service.getAllSubjects( req.query);
        return sendResponse(res, 200, "Subjects fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

const updateSubject = async (req, res, next) => {   
    try {
        const data = await service.updateSubject(req.params.id, req.body);
        if(!data){
            return sendResponse(res, 404, "Subject not found");
        }
        return sendResponse(res, 200, "Subject updated successfully", data);
    } catch (error) {
        next(error);
    }
};

const deleteSubject = async (req, res, next) => {
    try {
        const data = await service.deleteSubject(req.params.id);
        if(!data){
            return sendResponse(res, 404, "Subject not found");
        }
        return sendResponse(res, 200, "Subject deleted successfully", data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSubject,
    getSubjects,
    updateSubject,
    deleteSubject
};