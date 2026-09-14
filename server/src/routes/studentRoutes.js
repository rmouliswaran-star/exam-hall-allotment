const express = require("express");

const {
  getStudents,
  getStudentById,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");

const router = express.Router();

// GET /api/students
router.get("/", getStudents);

// GET /api/students/:id
router.get("/:id", getStudentById);

// POST /api/students
router.post("/", createStudent);

// POST /api/students/bulk
router.post("/bulk", bulkCreateStudents);

// PUT /api/students/:id
router.put("/:id", updateStudent);

// DELETE /api/students/:id
router.delete("/:id", deleteStudent);

module.exports = router;