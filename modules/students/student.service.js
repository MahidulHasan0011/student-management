const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

   const createStudent = async (data) => {
    const query = `
    INSERT INTO students (student_code, full_name, gender, date_of_birth, guardian_name, guardian_phone, address)
    Values($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;
    const values = [
      data.student_code,
      data.full_name,
      data.gender,
      data.date_of_birth,
      data.guardian_name,
      data.guardian_phone,
      data.address
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }
  // Get all students
  const getAllStudents = async (queryOptions) => {







    const query = `SELECT * From students
                  WHERE deleted_at IS NULL
                  ORDER BY created_at DESC`;
    const result = await db.query(query); 
    return result.rows;
  }
  //GET BY ID
  const getStudentById = async(id) => {
    const query = `SELECT * FROM students
                   WHERE id = $1 AND deleted_at IS NULL`;
    const result = await db.query(query,[id]);
    return result.rows[0];               
  } 
  //update student
  const updateStudent = async(id, data) => {
    const query = `UPDATE students
                   SET full_name = $1,
                        gender = $2,
                        guardian_name = $3,
                        guardian_phone = $4,
                        address = $5,
                        updated_at = NOW()
                    WHERE id = $6 AND deleted_at IS NULL
                    RETURNING *`;
    const values = [
      data.full_name,
      data.gender,
      data.guardian_name,
      data.guardian_phone,
      data.address ,
      id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  };
  // delete student by id (soft delete)
  const deleteStudent = async (id) => {
    const query = `UPDATE students
                   SET deleted_at = NOW()
                   WHERE id = $1 
                   RETURNING *`;
    const result = await bd.query(query, [id]);
    return result.rows[0];
  }


module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent };