const service = require('./classes.service');
const sendResponse = require("../../utils/response");

const createClass = async (req, res, next) => {
    try {
       const data = await service.createClass(req.body);
       return sendResponse(res, 201, "Class created successfully", data);
    } 
    catch (error){
        next(error);
    }
};

const getClasses = async (req, res, next) => {
    try {
        const result = await service.getAllClasses(req.query);
        return sendResponse(res, 200, result.message, {
            data: result.data,
            meta: result.meta,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const updateClass = async (req, res, next) => {
    try {
        const data = await service.updateClass(req.params.id, req.body);
        if(!data){
            return sendResponse(res, 404, "Class not found");
        }
        return sendResponse(res, 200, "Class updated successfully", data);
    } catch (error) {
        next(error);
    }
};

const deleteClass = async (req, res, next) => {
    try {        
        const data = await service.deleteClass(req.params.id);
        if(!data){
            return sendResponse(res, 404, "Class not found");
        }   
        return sendResponse(res, 200, "Class deleted successfully", data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createClass,
    getClasses,
    updateClass,
    deleteClass
};