const express = require("express");

const {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
} = require("../controllers/hallController");

const router = express.Router();

// ============================================================
// GET ALL HALLS
// GET /api/halls
// ============================================================

router.get("/", getHalls);

// ============================================================
// GET SINGLE HALL
// GET /api/halls/:id
// ============================================================

router.get("/:id", getHallById);

// ============================================================
// CREATE HALL
// POST /api/halls
// ============================================================

router.post("/", createHall);

// ============================================================
// UPDATE HALL
// PUT /api/halls/:id
// ============================================================

router.put("/:id", updateHall);

// ============================================================
// DELETE HALL
// DELETE /api/halls/:id
// ============================================================

router.delete("/:id", deleteHall);

module.exports = router;