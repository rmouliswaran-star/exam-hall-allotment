const db = require("../config/db");

// ============================================================
// GET ALL STUDENTS
// ============================================================

const getStudents = async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT
        s.id,
        s.register_number,
        s.roll_number,
        s.full_name,
        s.department_id,
        d.name AS department_name,
        d.code AS department_code,
        s.year,
        s.section,
        s.email,
        s.phone,
        s.is_active,
        s.created_at,
        s.updated_at
      FROM students s
      LEFT JOIN departments d
        ON s.department_id = d.id
      ORDER BY s.full_name ASC
    `);

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};


// ============================================================
// GET SINGLE STUDENT
// ============================================================

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.query(
      `
      SELECT
        s.id,
        s.register_number,
        s.roll_number,
        s.full_name,
        s.department_id,
        d.name AS department_name,
        d.code AS department_code,
        s.year,
        s.section,
        s.email,
        s.phone,
        s.is_active,
        s.created_at,
        s.updated_at
      FROM students s
      LEFT JOIN departments d
        ON s.department_id = d.id
      WHERE s.id = ?
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: students[0],
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
      error: error.message,
    });
  }
};


// ============================================================
// CREATE STUDENT
// ============================================================

const createStudent = async (req, res) => {
  try {
    const {
      register_number,
      roll_number,
      full_name,
      department_id,
      year,
      section,
      email,
      phone,
    } = req.body;

    if (
      !register_number ||
      !full_name ||
      !department_id ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Register number, full name, department, and year are required",
      });
    }

    const [department] = await db.query(
      "SELECT id FROM departments WHERE id = ?",
      [department_id]
    );

    if (department.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected department does not exist",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM students WHERE register_number = ?",
      [register_number.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO students
      (
        register_number,
        roll_number,
        full_name,
        department_id,
        year,
        section,
        email,
        phone
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        register_number.trim(),
        roll_number ? roll_number.trim() : null,
        full_name.trim(),
        department_id,
        year,
        section ? section.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        id: result.insertId,
        register_number: register_number.trim(),
        roll_number: roll_number ? roll_number.trim() : null,
        full_name: full_name.trim(),
        department_id,
        year,
        section: section ? section.trim() : null,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
      },
    });
  } catch (error) {
    console.error("Create student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  }
};


// ============================================================
// BULK CREATE STUDENTS
// ============================================================
// Excel data expected:
//
// register_number | roll_number | full_name | department_code
// year | section | email | phone
//
// Example:
//
// 24BCA001 | 01 | Mouliwaran R | BCA | 1 | A | email | phone
//
// department_id can also be supplied instead of department_code.
// ============================================================

const bulkCreateStudents = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No student data received",
      });
    }

    await connection.beginTransaction();

    let inserted = 0;
    let skipped = 0;

    const errors = [];
    const processedRegisterNumbers = new Set();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      const rowNumber = i + 2;

      const registerNumber = String(
        student.register_number || ""
      ).trim();

      const rollNumber = String(
        student.roll_number || ""
      ).trim();

      const fullName = String(
        student.full_name || ""
      ).trim();

      const departmentCode = String(
        student.department_code || ""
      ).trim().toUpperCase();

      const departmentId =
        student.department_id || null;

      const year = Number(student.year);

      const section = String(
        student.section || ""
      ).trim();

      const email = String(
        student.email || ""
      ).trim();

      const phone = String(
        student.phone || ""
      ).trim();

      // ------------------------------------------------------
      // REQUIRED VALIDATION
      // ------------------------------------------------------

      if (!registerNumber) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: "",
          message: "Register number is required",
        });

        continue;
      }

      if (!fullName) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: registerNumber,
          message: "Full name is required",
        });

        continue;
      }

      if (!year || year < 1 || year > 4) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: registerNumber,
          message: "Year must be between 1 and 4",
        });

        continue;
      }

      if (!departmentId && !departmentCode) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: registerNumber,
          message: "Department code or department ID is required",
        });

        continue;
      }

      // ------------------------------------------------------
      // DUPLICATE INSIDE EXCEL FILE
      // ------------------------------------------------------

      const registerKey = registerNumber.toUpperCase();

      if (processedRegisterNumbers.has(registerKey)) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: registerNumber,
          message: "Duplicate register number in Excel file",
        });

        continue;
      }

      processedRegisterNumbers.add(registerKey);

      // ------------------------------------------------------
      // FIND DEPARTMENT
      // ------------------------------------------------------

      let finalDepartmentId = departmentId;

      if (!finalDepartmentId && departmentCode) {
        const [departmentRows] = await connection.query(
          `
          SELECT id
          FROM departments
          WHERE UPPER(code) = ?
          LIMIT 1
          `,
          [departmentCode]
        );

        if (departmentRows.length === 0) {
          skipped++;

          errors.push({
            row: rowNumber,
            register_number: registerNumber,
            message: `Department code "${departmentCode}" does not exist`,
          });

          continue;
        }

        finalDepartmentId = departmentRows[0].id;
      }

      // ------------------------------------------------------
      // CHECK DEPARTMENT
      // ------------------------------------------------------

      const [departmentCheck] = await connection.query(
        "SELECT id FROM departments WHERE id = ?",
        [finalDepartmentId]
      );

      if (departmentCheck.length === 0) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: registerNumber,
          message: "Department does not exist",
        });

        continue;
      }

      // ------------------------------------------------------
      // CHECK DATABASE DUPLICATE
      // ------------------------------------------------------

      const [existing] = await connection.query(
        `
        SELECT id
        FROM students
        WHERE register_number = ?
        LIMIT 1
        `,
        [registerNumber]
      );

      if (existing.length > 0) {
        skipped++;

        errors.push({
          row: rowNumber,
          register_number: registerNumber,
          message: "Register number already exists",
        });

        continue;
      }

      // ------------------------------------------------------
      // INSERT STUDENT
      // ------------------------------------------------------

      await connection.query(
        `
        INSERT INTO students
        (
          register_number,
          roll_number,
          full_name,
          department_id,
          year,
          section,
          email,
          phone
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          registerNumber,
          rollNumber || null,
          fullName,
          finalDepartmentId,
          year,
          section || null,
          email || null,
          phone || null,
        ]
      );

      inserted++;
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Bulk student upload completed",
      summary: {
        total: students.length,
        inserted,
        skipped,
      },
      errors,
    });

  } catch (error) {
    await connection.rollback();

    console.error("Bulk create students error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to import students",
      error: error.message,
    });

  } finally {
    connection.release();
  }
};


// ============================================================
// UPDATE STUDENT
// ============================================================

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      register_number,
      roll_number,
      full_name,
      department_id,
      year,
      section,
      email,
      phone,
      is_active,
    } = req.body;

    if (
      !register_number ||
      !full_name ||
      !department_id ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Register number, full name, department, and year are required",
      });
    }

    const [student] = await db.query(
      "SELECT id FROM students WHERE id = ?",
      [id]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM students
      WHERE register_number = ?
      AND id != ?
      `,
      [register_number.trim(), id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    await db.query(
      `
      UPDATE students
      SET
        register_number = ?,
        roll_number = ?,
        full_name = ?,
        department_id = ?,
        year = ?,
        section = ?,
        email = ?,
        phone = ?,
        is_active = ?
      WHERE id = ?
      `,
      [
        register_number.trim(),
        roll_number ? roll_number.trim() : null,
        full_name.trim(),
        department_id,
        year,
        section ? section.trim() : null,
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        is_active === undefined ? 1 : is_active ? 1 : 0,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Student updated successfully",
    });
  } catch (error) {
    console.error("Update student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};


// ============================================================
// DELETE STUDENT
// ============================================================

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const [student] = await db.query(
      "SELECT id FROM students WHERE id = ?",
      [id]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await db.query(
      "DELETE FROM students WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent,
};