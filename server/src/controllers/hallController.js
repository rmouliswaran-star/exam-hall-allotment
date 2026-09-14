const db = require("../config/db");

// ============================================================
// GET ALL HALLS
// GET /api/halls
// ============================================================

const getHalls = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        hall_name,
        hall_number,
        building,
        floor,
        capacity,
        is_active,
        created_at,
        updated_at
      FROM halls
      ORDER BY id DESC
    `);

    return res.json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("Get halls error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch halls",
      error: error.message,
    });
  }
};


// ============================================================
// GET HALL BY ID
// GET /api/halls/:id
// ============================================================

const getHallById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        id,
        hall_name,
        hall_number,
        building,
        floor,
        capacity,
        is_active,
        created_at,
        updated_at
      FROM halls
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    console.error("Get hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hall",
      error: error.message,
    });
  }
};


// ============================================================
// CREATE HALL
// POST /api/halls
// ============================================================

const createHall = async (req, res) => {
  try {
    const {
      hall_name,
      hall_number,
      building,
      floor,
      capacity,
      is_active,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!hall_name || !hall_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hall name is required",
      });
    }

    if (!hall_number || !hall_number.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hall number is required",
      });
    }

    if (
      capacity === undefined ||
      capacity === null ||
      capacity === "" ||
      Number(capacity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be greater than 0",
      });
    }

    // --------------------------------------------------------
    // CHECK DUPLICATE HALL NUMBER
    // --------------------------------------------------------

    const [existing] = await db.query(
      `
      SELECT id
      FROM halls
      WHERE hall_number = ?
      `,
      [hall_number.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Hall number already exists",
      });
    }

    // --------------------------------------------------------
    // INSERT HALL
    // --------------------------------------------------------

    const [result] = await db.query(
      `
      INSERT INTO halls
      (
        hall_name,
        hall_number,
        building,
        floor,
        capacity,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        hall_name.trim(),
        hall_number.trim(),
        building?.trim() || null,
        floor?.trim() || null,
        Number(capacity),
        is_active === undefined ? 1 : Number(is_active),
      ]
    );

    // --------------------------------------------------------
    // GET CREATED HALL
    // --------------------------------------------------------

    const [newHall] = await db.query(
      `
      SELECT
        id,
        hall_name,
        hall_number,
        building,
        floor,
        capacity,
        is_active,
        created_at,
        updated_at
      FROM halls
      WHERE id = ?
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Hall created successfully",
      data: newHall[0],
    });

  } catch (error) {
    console.error("Create hall error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Hall number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create hall",
      error: error.message,
    });
  }
};


// ============================================================
// UPDATE HALL
// PUT /api/halls/:id
// ============================================================

const updateHall = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      hall_name,
      hall_number,
      building,
      floor,
      capacity,
      is_active,
    } = req.body;

    // --------------------------------------------------------
    // CHECK HALL EXISTS
    // --------------------------------------------------------

    const [existingHall] = await db.query(
      `
      SELECT id
      FROM halls
      WHERE id = ?
      `,
      [id]
    );

    if (existingHall.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!hall_name || !hall_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hall name is required",
      });
    }

    if (!hall_number || !hall_number.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hall number is required",
      });
    }

    if (
      capacity === undefined ||
      capacity === null ||
      capacity === "" ||
      Number(capacity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be greater than 0",
      });
    }

    // --------------------------------------------------------
    // CHECK DUPLICATE HALL NUMBER
    // --------------------------------------------------------

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM halls
      WHERE hall_number = ?
      AND id != ?
      `,
      [hall_number.trim(), id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Hall number already exists",
      });
    }

    // --------------------------------------------------------
    // UPDATE HALL
    // --------------------------------------------------------

    await db.query(
      `
      UPDATE halls
      SET
        hall_name = ?,
        hall_number = ?,
        building = ?,
        floor = ?,
        capacity = ?,
        is_active = ?
      WHERE id = ?
      `,
      [
        hall_name.trim(),
        hall_number.trim(),
        building?.trim() || null,
        floor?.trim() || null,
        Number(capacity),
        is_active === undefined ? 1 : Number(is_active),
        id,
      ]
    );

    // --------------------------------------------------------
    // GET UPDATED HALL
    // --------------------------------------------------------

    const [updatedHall] = await db.query(
      `
      SELECT
        id,
        hall_name,
        hall_number,
        building,
        floor,
        capacity,
        is_active,
        created_at,
        updated_at
      FROM halls
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Hall updated successfully",
      data: updatedHall[0],
    });

  } catch (error) {
    console.error("Update hall error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Hall number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update hall",
      error: error.message,
    });
  }
};


// ============================================================
// DELETE HALL
// DELETE /api/halls/:id
// ============================================================

const deleteHall = async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------------------------------
    // CHECK HALL EXISTS
    // --------------------------------------------------------

    const [existingHall] = await db.query(
      `
      SELECT id
      FROM halls
      WHERE id = ?
      `,
      [id]
    );

    if (existingHall.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    await db.query(
      `
      DELETE FROM halls
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: "Hall deleted successfully",
    });

  } catch (error) {
    console.error("Delete hall error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete hall",
      error: error.message,
    });
  }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
};