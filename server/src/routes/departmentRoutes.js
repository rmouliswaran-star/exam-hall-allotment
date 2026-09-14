const express = require("express");

const {
  getDepartments,
  createDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const router = express.Router();


// GET /api/departments
router.get("/", getDepartments);


// POST /api/departments
router.post("/", createDepartment);


// DELETE /api/departments/:id
router.delete("/:id", deleteDepartment);


module.exports = router;