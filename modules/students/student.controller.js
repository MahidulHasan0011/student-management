const studentService  = require("./student.service");
const sendResponse = require("../../utils/response");

//create student
const createStudent = async (req, res, next) => {
    try{
        const result  = await studentService.createStudent(req.body);
        return sendResponse(res, 201, "Student created successfully", result );
       
    } catch (error) {
       next(error);
    }
};

//get all students
const getAllStudents = async (req, res, next) => {
    try{
        const result = await studentService.getAllStudents( req.query);
        return sendResponse(res, 200, result.message, {
            data:       result.data,
            meta:       result.meta,
            pagination: result.pagination
        });
    } catch (error) {
       next(error);
    }
};
//get student by id
const getStudentById = async (req, res, next ) => {
    try{
        const student = await studentService.getStudentById(req.params.id);
        if(!student){
            return sendResponse(res, 404, "Student not found");
        }
        return sendResponse( res, 200, "Student fetched", student);
    }
    catch (error) {
        next(error);
    }
}
//update student
const updateStudent = async (req, res, next) => {
    try{
        const student = await studentService.updateStudent(req.params.id, req.body);
        if(!student){
            return sendResponse(res, 404, "Student not found");
        }
        return sendResponse(res, 200, "Student updated successfully", student);
    }
    catch (error){
        next(error);
    }
}

// delete student
const deleteStudent = async (req, res, next) => {
    try{
        const student = await studentService.deleteStudent(req.params.id);
        if(!student){
            return sendResponse(res, 404, "Student not found");
        }
        return sendResponse(res, 200, "Student deleted successfully", student);
    }
    catch(error){
        next(error);
    }

}

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent
};