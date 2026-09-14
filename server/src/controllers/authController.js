const db = require("../config/db");
const bcrypt = require("bcryptjs");

// ============================================================
// ADMIN LOGIN
// POST /api/auth/login
// ============================================================

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const [admins] = await db.query(
      `
      SELECT
        id,
        username,
        password,
        full_name,
        role,
        is_active
      FROM admins
      WHERE username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "This admin account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

module.exports = {
  loginAdmin,
};