const express = require("express");

const router = express.Router();

const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,

  getExamStudents,
  getStudentsForExam,
  addStudentsToExam,
  removeStudentFromExam,
  replaceExamStudents,
} = require("../controllers/examController");


// ============================================================
// EXAM CRUD
// ============================================================

router.get("/", getExams);

router.get("/:id", getExamById);

router.post("/", createExam);

router.put("/:id", updateExam);

router.delete("/:id", deleteExam);


// ============================================================
// EXAM STUDENT MANAGEMENT
// ============================================================

// Get only students currently assigned to exam
router.get(
  "/:examId/students",
  getExamStudents
);

// Get ALL students + assigned status
router.get(
  "/:examId/available-students",
  getStudentsForExam
);

// Add students
router.post(
  "/:examId/students",
  addStudentsToExam
);

// Remove one student
router.delete(
  "/:examId/students/:studentId",
  removeStudentFromExam
);

// Replace complete student list
router.put(
  "/:examId/students",
  replaceExamStudents
);


module.exports = router;