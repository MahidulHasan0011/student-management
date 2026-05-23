const pool = require("../config/db");

class Student {

  static async create(name, email, age) {
    return pool.query(
      "INSERT INTO students (name, email, age) VALUES ($1, $2, $3) RETURNING *",
      [name, email, age]
    );
  }

  static async findAll() {
    return await pool.query("SELECT * FROM students");
  }

}

module.exports = Student;