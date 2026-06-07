const service = require('./teachers.service');
const sendResponse = require("../../utils/response");


const createTeacher = async (req, res, next) => {
    try {
       const data = await service.createTeacher(req.body);
       return sendResponse(res, 201,"Teacher created", data);
    } catch (error) {
        next(error);
    }
};

const getTeacher = async (req, res, next) => {
    try {
        const result = await service.getAllTeachers( req.query);
        return sendResponse(res, 200, result.message, {
            data: result.data,
            meta: result.meta,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const updateTeacher = async (req, res, next) => {   
    try {
        const data = await service.updateTeacher(req.params.id, req.body);
        if(!data){
            return sendResponse(res, 404, "Teacher not found");
        }
        return sendResponse(res, 200, "Teacher updated successfully", data);
    } catch (error) {
        next(error);
    }
};

const deleteTeacher = async (req, res, next) => {
    try {
        const data = await service.deleteTeacher(req.params.id);
        if(!data){
            return sendResponse(res, 404, "Teacher not found");
        }
        return sendResponse(res, 200, "Teacher deleted successfully", data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTeacher,
    getTeacher,
    updateTeacher,
    deleteTeacher
};