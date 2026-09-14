const express = require("express");

const router = express.Router();

const {

  getStudentsForAllotment,

  generateAllotment,

  getExamAllotments,

} = require("../controllers/allotmentController");

// ============================================================

// GET STUDENTS FOR AN EXAM

// GET /api/allotments/exam/:examId/students

// ============================================================

router.get(

  "/exam/:examId/students",

  getStudentsForAllotment

);

// ============================================================

// GET EXISTING ALLOTMENTS FOR AN EXAM

// GET /api/allotments/exam/:examId

// ============================================================

router.get(

  "/exam/:examId",

  getExamAllotments

);

// ============================================================

// GENERATE ALLOTMENT

// POST /api/allotments/generate

// ============================================================

router.post(

  "/generate",

  generateAllotment

);

module.exports = router;

