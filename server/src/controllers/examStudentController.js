const db = require("../config/db");

// ============================================================
// ADD STUDENTS TO EXAM
// POST /api/exams/:examId/students
// ============================================================

const addStudentsToExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { student_ids } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!examId || !Number.isInteger(Number(examId))) {
      return res.status(400).json({
        success: false,
        message: "Valid exam ID is required",
      });
    }

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "student_ids must be a non-empty array",
      });
    }

    const examIdNumber = Number(examId);

    const studentIds = [
      ...new Set(
        student_ids
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];

    if (studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid student IDs provided",
      });
    }

    // --------------------------------------------------------
    // CHECK EXAM
    // --------------------------------------------------------

    const [exam] = await db.query(
      "SELECT id FROM exams WHERE id = ?",
      [examIdNumber]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // --------------------------------------------------------
    // CHECK STUDENTS
    // --------------------------------------------------------

    const placeholders = studentIds.map(() => "?").join(",");

    const [students] = await db.query(
      `
      SELECT id
      FROM students
      WHERE id IN (${placeholders})
      AND is_active = 1
      `,
      studentIds
    );

    const validStudentIds = students.map((student) => student.id);

    if (validStudentIds.length !== studentIds.length) {
      const validSet = new Set(validStudentIds);

      const invalidStudentIds = studentIds.filter(
        (id) => !validSet.has(id)
      );

      return res.status(400).json({
        success: false,
        message: "Some student IDs are invalid or inactive",
        invalid_student_ids: invalidStudentIds,
      });
    }

    // --------------------------------------------------------
    // CHECK ALREADY REGISTERED
    // --------------------------------------------------------

    const [existing] = await db.query(
      `
      SELECT student_id
      FROM exam_students
      WHERE exam_id = ?
      AND student_id IN (${placeholders})
      `,
      [examIdNumber, ...studentIds]
    );

    const existingIds = new Set(
      existing.map((row) => row.student_id)
    );

    const newStudentIds = studentIds.filter(
      (id) => !existingIds.has(id)
    );

    if (newStudentIds.length === 0) {
      return res.status(409).json({
        success: false,
        message: "All selected students are already registered for this exam",
      });
    }

    // --------------------------------------------------------
    // INSERT
    // --------------------------------------------------------

    const values = newStudentIds
      .map(() => "(?, ?)")
      .join(",");

    const params = [];

    for (const studentId of newStudentIds) {
      params.push(examIdNumber, studentId);
    }

    await db.query(
      `
      INSERT INTO exam_students
      (exam_id, student_id)
      VALUES ${values}
      `,
      params
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Students added to exam successfully",
      data: {
        exam_id: examIdNumber,
        added_count: newStudentIds.length,
        student_ids: newStudentIds,
      },
    });

  } catch (error) {
    console.error("Add students to exam error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add students to exam",
      error: error.message,
    });
  }
};


// ============================================================
// GET STUDENTS REGISTERED FOR EXAM
// GET /api/exams/:examId/students
// ============================================================

const getExamStudents = async (req, res) => {
  try {
    const { examId } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        es.id AS exam_student_id,
        s.id AS student_id,
        s.register_number,
        s.roll_number,
        s.full_name,
        s.department_id,
        d.name AS department_name,
        d.code AS department_code,
        s.year,
        s.section
      FROM exam_students es
      INNER JOIN students s
        ON es.student_id = s.id
      INNER JOIN departments d
        ON s.department_id = d.id
      WHERE es.exam_id = ?
      ORDER BY
        s.year ASC,
        s.section ASC,
        s.roll_number ASC
      `,
      [examId]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    console.error("Get exam students error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch exam students",
      error: error.message,
    });
  }
};


// ============================================================
// REMOVE STUDENT FROM EXAM
// DELETE /api/exams/:examId/students/:studentId
// ============================================================

const removeStudentFromExam = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const [existing] = await db.query(
      `
      SELECT id
      FROM exam_students
      WHERE exam_id = ?
      AND student_id = ?
      `,
      [examId, studentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student is not registered for this exam",
      });
    }

    await db.query(
      `
      DELETE FROM exam_students
      WHERE exam_id = ?
      AND student_id = ?
      `,
      [examId, studentId]
    );

    res.json({
      success: true,
      message: "Student removed from exam successfully",
    });

  } catch (error) {
    console.error("Remove exam student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove student from exam",
      error: error.message,
    });
  }
};


module.exports = {
  addStudentsToExam,
  getExamStudents,
  removeStudentFromExam,
};