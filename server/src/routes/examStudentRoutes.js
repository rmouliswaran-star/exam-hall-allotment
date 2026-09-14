const express = require("express");

const {
  addStudentsToExam,
  getExamStudents,
  removeStudentFromExam,
} = require("../controllers/examStudentController");

const router = express.Router();

// Add students to exam
router.post("/:examId/students", addStudentsToExam);

// Get students of exam
router.get("/:examId/students", getExamStudents);

// Remove student from exam
router.delete(
  "/:examId/students/:studentId",
  removeStudentFromExam
);

module.exports = router;