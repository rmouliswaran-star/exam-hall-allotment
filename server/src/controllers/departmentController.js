const db = require("../config/db");

// =========================================================
// GET ALL DEPARTMENTS
// =========================================================
const getDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(
      "SELECT * FROM departments ORDER BY name ASC"
    );

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};


// =========================================================
// CREATE DEPARTMENT
// =========================================================
const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Department name and code are required",
      });
    }

    const [result] = await db.query(
      `INSERT INTO departments
       (name, code, description)
       VALUES (?, ?, ?)`,
      [
        name.trim(),
        code.trim().toUpperCase(),
        description ? description.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: {
        id: result.insertId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description ? description.trim() : null,
      },
    });
  } catch (error) {
    console.error("Create department error:", error);

    // Duplicate department code
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A department with this code already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create department",
    });
  }
};


// =========================================================
// DELETE DEPARTMENT
// =========================================================
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    // Check whether department exists
    const [departments] = await db.query(
      "SELECT id, name, code FROM departments WHERE id = ?",
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Delete department
    await db.query(
      "DELETE FROM departments WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Department deleted successfully",
      data: {
        id: Number(id),
      },
    });
  } catch (error) {
    console.error("Delete department error:", error);

    // Department is being used by students or another table
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message:
          "This department cannot be deleted because students or other records are using it.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
};


// =========================================================
// EXPORT
// =========================================================
module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment,
};