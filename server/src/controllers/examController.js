const db = require("../config/db");

// ============================================================
// GET ALL EXAMS
// ============================================================

const getExams = async (req, res) => {
  try {
    const [exams] = await db.query(`
      SELECT
        e.id,
        e.exam_name,
        e.subject_code,
        e.subject_name,
        e.exam_date,
        e.session,
        e.start_time,
        e.end_time,
        e.duration_minutes,
        e.academic_year,
        e.semester,
        e.status,
        e.created_at,
        e.updated_at,

        (
          SELECT COUNT(*)
          FROM exam_students es
          WHERE es.exam_id = e.id
        ) AS student_count

      FROM exams e
      ORDER BY e.exam_date ASC, e.start_time ASC
    `);

    res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error("Get exams error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message,
    });
  }
};


// ============================================================
// GET SINGLE EXAM
// ============================================================

const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const [exams] = await db.query(
      `
      SELECT
        id,
        exam_name,
        subject_code,
        subject_name,
        exam_date,
        session,
        start_time,
        end_time,
        duration_minutes,
        academic_year,
        semester,
        status,
        created_at,
        updated_at
      FROM exams
      WHERE id = ?
      `,
      [id]
    );

    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.json({
      success: true,
      data: exams[0],
    });
  } catch (error) {
    console.error("Get exam error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch exam",
      error: error.message,
    });
  }
};


// ============================================================
// CREATE EXAM
// ============================================================

const createExam = async (req, res) => {
  try {
    const {
      exam_name,
      subject_code,
      subject_name,
      exam_date,
      session,
      start_time,
      end_time,
      duration_minutes,
      academic_year,
      semester,
      status,
    } = req.body;

    if (
      !exam_name ||
      !subject_name ||
      !exam_date ||
      !session
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exam name, subject name, exam date, and session are required",
      });
    }

    if (!["FN", "AN"].includes(session)) {
      return res.status(400).json({
        success: false,
        message: "Session must be FN or AN",
      });
    }

    const finalStatus = status || "scheduled";

    if (
      ![
        "scheduled",
        "ongoing",
        "completed",
        "cancelled",
      ].includes(finalStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status",
      });
    }

    const [existing] = await db.query(
      `
      SELECT id
      FROM exams
      WHERE subject_name = ?
      AND exam_date = ?
      AND session = ?
      LIMIT 1
      `,
      [
        subject_name.trim(),
        exam_date,
        session,
      ]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "An exam for this subject already exists on this date and session",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO exams
      (
        exam_name,
        subject_code,
        subject_name,
        exam_date,
        session,
        start_time,
        end_time,
        duration_minutes,
        academic_year,
        semester,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        exam_name.trim(),
        subject_code ? subject_code.trim() : null,
        subject_name.trim(),
        exam_date,
        session,
        start_time || null,
        end_time || null,
        duration_minutes || null,
        academic_year ? academic_year.trim() : null,
        semester ? semester.trim() : null,
        finalStatus,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: {
        id: result.insertId,
        exam_name: exam_name.trim(),
        subject_code: subject_code
          ? subject_code.trim()
          : null,
        subject_name: subject_name.trim(),
        exam_date,
        session,
        start_time: start_time || null,
        end_time: end_time || null,
        duration_minutes: duration_minutes || null,
        academic_year: academic_year
          ? academic_year.trim()
          : null,
        semester: semester
          ? semester.trim()
          : null,
        status: finalStatus,
      },
    });
  } catch (error) {
    console.error("Create exam error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message,
    });
  }
};


// ============================================================
// UPDATE EXAM
// ============================================================

const updateExam = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      exam_name,
      subject_code,
      subject_name,
      exam_date,
      session,
      start_time,
      end_time,
      duration_minutes,
      academic_year,
      semester,
      status,
    } = req.body;

    if (
      !exam_name ||
      !subject_name ||
      !exam_date ||
      !session
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Exam name, subject name, exam date, and session are required",
      });
    }

    if (!["FN", "AN"].includes(session)) {
      return res.status(400).json({
        success: false,
        message: "Session must be FN or AN",
      });
    }

    if (
      ![
        "scheduled",
        "ongoing",
        "completed",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status",
      });
    }

    const [exam] = await db.query(
      "SELECT id FROM exams WHERE id = ?",
      [id]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM exams
      WHERE subject_name = ?
      AND exam_date = ?
      AND session = ?
      AND id != ?
      LIMIT 1
      `,
      [
        subject_name.trim(),
        exam_date,
        session,
        id,
      ]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Another exam for this subject already exists on this date and session",
      });
    }

    await db.query(
      `
      UPDATE exams
      SET
        exam_name = ?,
        subject_code = ?,
        subject_name = ?,
        exam_date = ?,
        session = ?,
        start_time = ?,
        end_time = ?,
        duration_minutes = ?,
        academic_year = ?,
        semester = ?,
        status = ?
      WHERE id = ?
      `,
      [
        exam_name.trim(),
        subject_code ? subject_code.trim() : null,
        subject_name.trim(),
        exam_date,
        session,
        start_time || null,
        end_time || null,
        duration_minutes || null,
        academic_year ? academic_year.trim() : null,
        semester ? semester.trim() : null,
        status,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Exam updated successfully",
    });
  } catch (error) {
    console.error("Update exam error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update exam",
      error: error.message,
    });
  }
};


// ============================================================
// DELETE EXAM
// ============================================================

const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const [exam] = await db.query(
      "SELECT id FROM exams WHERE id = ?",
      [id]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    await db.query(
      "DELETE FROM exams WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete exam error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete exam",
      error: error.message,
    });
  }
};


// ============================================================
// GET STUDENTS ASSIGNED TO ONE EXAM
// ============================================================

const getExamStudents = async (req, res) => {
  try {
    const { examId } = req.params;

    const [exam] = await db.query(
      `
      SELECT id, exam_name, subject_name
      FROM exams
      WHERE id = ?
      `,
      [examId]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const [students] = await db.query(
      `
      SELECT
        s.id,
        s.register_number,
        s.full_name,
        s.department_id,
        d.department_name,
        d.department_code,
        s.year,
        s.section

      FROM exam_students es

      INNER JOIN students s
        ON s.id = es.student_id

      LEFT JOIN departments d
        ON d.id = s.department_id

      WHERE es.exam_id = ?

      ORDER BY
        d.department_code ASC,
        s.year ASC,
        s.register_number ASC
      `,
      [examId]
    );

    res.json({
      success: true,
      exam: exam[0],
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error(
      "Get exam students error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch exam students",
      error: error.message,
    });
  }
};


// ============================================================
// GET ALL STUDENTS WITH ASSIGNMENT STATUS
// ============================================================

const getStudentsForExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const [exam] = await db.query(
      "SELECT id FROM exams WHERE id = ?",
      [examId]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const [students] = await db.query(
      `
      SELECT
        s.id,
        s.register_number,
        s.full_name,
        s.department_id,
        d.department_name,
        d.department_code,
        s.year,
        s.section,

        CASE
          WHEN es.student_id IS NULL THEN 0
          ELSE 1
        END AS assigned

      FROM students s

      LEFT JOIN departments d
        ON d.id = s.department_id

      LEFT JOIN exam_students es
        ON es.student_id = s.id
        AND es.exam_id = ?

      ORDER BY
        d.department_code ASC,
        s.year ASC,
        s.register_number ASC
      `,
      [examId]
    );

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error(
      "Get students for exam error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
      error: error.message,
    });
  }
};


// ============================================================
// ADD STUDENTS TO EXAM
// ============================================================

const addStudentsToExam = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { examId } = req.params;
    const { student_ids } = req.body;

    if (!Array.isArray(student_ids)) {
      return res.status(400).json({
        success: false,
        message: "student_ids must be an array",
      });
    }

    const [exam] = await connection.query(
      "SELECT id FROM exams WHERE id = ?",
      [examId]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    await connection.beginTransaction();

    for (const studentId of student_ids) {
      await connection.query(
        `
        INSERT IGNORE INTO exam_students
        (exam_id, student_id)
        VALUES (?, ?)
        `,
        [examId, Number(studentId)]
      );
    }

    await connection.commit();

    const [students] = await connection.query(
      `
      SELECT
        s.id,
        s.register_number,
        s.full_name,
        d.department_code,
        s.year,
        s.section

      FROM exam_students es

      INNER JOIN students s
        ON s.id = es.student_id

      LEFT JOIN departments d
        ON d.id = s.department_id

      WHERE es.exam_id = ?

      ORDER BY s.register_number ASC
      `,
      [examId]
    );

    res.json({
      success: true,
      message: "Students added to exam successfully",
      data: students,
      count: students.length,
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Add students to exam error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to add students to exam",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


// ============================================================
// REMOVE ONE STUDENT FROM EXAM
// ============================================================

const removeStudentFromExam = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const [result] = await db.query(
      `
      DELETE FROM exam_students
      WHERE exam_id = ?
      AND student_id = ?
      `,
      [examId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Student is not assigned to this exam",
      });
    }

    // Also remove existing hall allotment
    await db.query(
      `
      DELETE FROM allotments
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
    console.error(
      "Remove student from exam error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to remove student from exam",
      error: error.message,
    });
  }
};


// ============================================================
// REPLACE ALL STUDENTS FOR AN EXAM
// ============================================================

const replaceExamStudents = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { examId } = req.params;
    const { student_ids } = req.body;

    if (!Array.isArray(student_ids)) {
      return res.status(400).json({
        success: false,
        message: "student_ids must be an array",
      });
    }

    const [exam] = await connection.query(
      "SELECT id FROM exams WHERE id = ?",
      [examId]
    );

    if (exam.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    await connection.beginTransaction();

    // Remove old exam students
    await connection.query(
      `
      DELETE FROM exam_students
      WHERE exam_id = ?
      `,
      [examId]
    );

    // Remove old allotment
    await connection.query(
      `
      DELETE FROM allotments
      WHERE exam_id = ?
      `,
      [examId]
    );

    // Add selected students
    for (const studentId of student_ids) {
      await connection.query(
        `
        INSERT INTO exam_students
        (exam_id, student_id)
        VALUES (?, ?)
        `,
        [examId, Number(studentId)]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Exam students updated successfully",
      count: student_ids.length,
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Replace exam students error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update exam students",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
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
};