const stidentModel = require("./student.service");
const sendResponse = require("../../utils/response");

//create student
exports.createStudent = async (req, res) => {
    try{
        const { name, email, age } = req.body;
        const result = await stidentModel.create(name, email, age);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//get all students
exports.getAllStudents = async (req,res) => {
    try{
        const result = await stidentModel.findAll();
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
