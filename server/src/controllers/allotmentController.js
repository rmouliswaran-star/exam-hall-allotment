const db = require("../config/db");

// ============================================================
// GET STUDENTS REGISTERED FOR AN EXAM
// GET /api/allotments/exam/:examId/students
// ============================================================

const getStudentsForAllotment = async (req, res) => {
  try {
    const examId = Number(req.params.examId);

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid Exam ID is required",
      });
    }

    const [students] = await db.query(
      `
      SELECT
        s.id AS student_id,
        s.register_number,
        s.roll_number,
        s.full_name,
        s.year,
        s.section,
        s.department_id,

        d.name AS department_name,
        d.code AS department_code

      FROM exam_students es

      INNER JOIN students s
        ON es.student_id = s.id

      LEFT JOIN departments d
        ON s.department_id = d.id

      WHERE es.exam_id = ?
        AND s.is_active = 1

      ORDER BY s.register_number ASC
      `,
      [examId]
    );

    return res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("Get students for allotment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam students",
      error: error.message,
    });
  }
};


// ============================================================
// GENERATE MULTI-EXAM HALL ALLOTMENT
//
// POST /api/allotments/generate
//
// BODY:
//
// {
//   exam_ids: [1, 2],
//   hall_ids: [1, 2, 3]
// }
//
// IMPORTANT NEW RULE:
//
// If 2 exams are selected:
//
// Exam 1 + Exam 2 students are MIXED inside the same halls.
//
// Example:
//
// Hall 1
//   Exam 1
//   Exam 2
//   Exam 1
//   Exam 2
//
// Hall 2
//   Exam 1
//   Exam 2
//   Exam 1
//   Exam 2
//
// Hall capacity is always respected.
// ============================================================

const generateAllotment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { exam_ids, hall_ids } = req.body;

    // ========================================================
    // VALIDATE EXAMS
    // ========================================================

    if (!Array.isArray(exam_ids) || exam_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one examination.",
      });
    }

    const examIds = [
      ...new Set(
        exam_ids
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )
      ),
    ];

    if (examIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid examinations selected.",
      });
    }

    // ========================================================
    // VALIDATE HALLS
    // ========================================================

    if (!Array.isArray(hall_ids) || hall_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one examination hall.",
      });
    }

    const hallIds = [
      ...new Set(
        hall_ids
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )
      ),
    ];

    if (hallIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid halls selected.",
      });
    }

    // ========================================================
    // START TRANSACTION
    // ========================================================

    await connection.beginTransaction();

    // ========================================================
    // GET SELECTED EXAMS
    // ========================================================

    const examPlaceholders = examIds
      .map(() => "?")
      .join(",");

    const [exams] = await connection.query(
      `
      SELECT
        id,
        exam_name,
        subject_code,
        subject_name,
        exam_date,
        session
      FROM exams
      WHERE id IN (${examPlaceholders})
      ORDER BY id ASC
      `,
      examIds
    );

    if (exams.length !== examIds.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "One or more selected examinations are invalid.",
      });
    }

    // ========================================================
    // GET SELECTED HALLS
    // ========================================================

    const hallPlaceholders = hallIds
      .map(() => "?")
      .join(",");

    const [halls] = await connection.query(
      `
      SELECT
        id,
        hall_name,
        hall_number,
        building,
        floor,
        capacity,
        is_active
      FROM halls
      WHERE id IN (${hallPlaceholders})
        AND is_active = 1
      ORDER BY id ASC
      `,
      hallIds
    );

    if (halls.length !== hallIds.length) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "One or more selected halls are invalid or inactive.",
      });
    }

    // ========================================================
    // CLEAN HALL DATA
    // ========================================================

    const usableHalls = halls.map((hall) => ({
      ...hall,
      id: Number(hall.id),
      capacity: Number(hall.capacity || 0),
    }));

    // ========================================================
    // CHECK HALL CAPACITY
    // ========================================================

    const invalidHall = usableHalls.find(
      (hall) => hall.capacity <= 0
    );

    if (invalidHall) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `Hall ${invalidHall.hall_number} has invalid capacity.`,
      });
    }

    // ========================================================
    // GET STUDENTS SEPARATELY FOR EACH EXAM
    //
    // THIS IS IMPORTANT.
    //
    // We keep each exam's students in its own array so that
    // we can mix Exam 1 + Exam 2 later.
    // ========================================================

    const studentsByExam = {};

    for (const exam of exams) {
      const [examStudents] = await connection.query(
        `
        SELECT
          es.exam_id,

          s.id AS student_id,
          s.register_number,
          s.roll_number,
          s.full_name,
          s.year,
          s.section,
          s.department_id,

          d.name AS department_name,
          d.code AS department_code

        FROM exam_students es

        INNER JOIN students s
          ON es.student_id = s.id

        LEFT JOIN departments d
          ON s.department_id = d.id

        WHERE es.exam_id = ?
          AND s.is_active = 1

        ORDER BY s.register_number ASC
        `,
        [exam.id]
      );

      studentsByExam[exam.id] = examStudents.map((student) => ({
        ...student,

        exam_id: Number(exam.id),

        exam_name: exam.exam_name,

        subject_code: exam.subject_code,

        subject_name: exam.subject_name,

        exam_date: exam.exam_date,

        session: exam.session,
      }));
    }

    // ========================================================
    // CHECK STUDENTS
    // ========================================================

    let totalStudents = 0;

    for (const examId of examIds) {
      totalStudents += studentsByExam[examId].length;
    }

    if (totalStudents === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "No students are registered for the selected examinations.",
      });
    }

    // ========================================================
    // TOTAL CAPACITY
    // ========================================================

    const totalCapacity = usableHalls.reduce(
      (total, hall) =>
        total + hall.capacity,
      0
    );

    // ========================================================
    // CAPACITY CHECK
    // ========================================================

    if (totalStudents > totalCapacity) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Not enough hall capacity. Students: ${totalStudents}, Capacity: ${totalCapacity}`,
      });
    }

    // ========================================================
    // DELETE OLD ALLOTMENTS
    // ========================================================

    await connection.query(
      `
      DELETE FROM allotments
      WHERE exam_id IN (${examPlaceholders})
      `,
      examIds
    );

    // ========================================================
    // CREATE HALL STRUCTURE
    // ========================================================

    const generatedHalls = usableHalls.map((hall) => ({
      hall_id: hall.id,

      hall_name: hall.hall_name,

      hall_number: hall.hall_number,

      building: hall.building,

      floor: hall.floor,

      capacity: hall.capacity,

      student_count: 0,

      groups: {},

      students: [],
    }));

    // ========================================================
    // CREATE MIXED STUDENT LIST
    //
    // NEW ALGORITHM
    //
    // For 2 exams:
    //
    // Exam 1 student
    // Exam 2 student
    // Exam 1 student
    // Exam 2 student
    //
    // The students are taken from separate queues.
    // ========================================================

    const mixedStudents = [];

    if (examIds.length === 2) {
      const exam1Students =
        studentsByExam[examIds[0]];

      const exam2Students =
        studentsByExam[examIds[1]];

      let index1 = 0;
      let index2 = 0;

      // Alternate between Exam 1 and Exam 2
      while (
        index1 < exam1Students.length ||
        index2 < exam2Students.length
      ) {
        // Exam 1
        if (index1 < exam1Students.length) {
          mixedStudents.push(
            exam1Students[index1]
          );

          index1++;
        }

        // Exam 2
        if (index2 < exam2Students.length) {
          mixedStudents.push(
            exam2Students[index2]
          );

          index2++;
        }
      }
    } else {
      // ======================================================
      // MORE THAN 2 EXAMS
      //
      // Round-robin distribution:
      //
      // Exam 1
      // Exam 2
      // Exam 3
      // Exam 1
      // Exam 2
      // Exam 3
      // ======================================================

      const examIndexes = {};

      for (const examId of examIds) {
        examIndexes[examId] = 0;
      }

      let studentsRemaining = true;

      while (studentsRemaining) {
        studentsRemaining = false;

        for (const examId of examIds) {
          const list =
            studentsByExam[examId];

          const index =
            examIndexes[examId];

          if (index < list.length) {
            mixedStudents.push(
              list[index]
            );

            examIndexes[examId]++;

            studentsRemaining = true;
          }
        }
      }
    }

    // ========================================================
    // VERIFY MIXED LIST
    // ========================================================

    if (
      mixedStudents.length !==
      totalStudents
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Student mixing failed. Expected ${totalStudents}, got ${mixedStudents.length}.`,
      });
    }

    // ========================================================
    // CALCULATE HOW MANY STUDENTS GO INTO EACH HALL
    //
    // We distribute as evenly as possible while respecting
    // each hall's capacity.
    // ========================================================

    let remainingStudents =
      totalStudents;

    const finalTargets =
      generatedHalls.map(
        () => 0
      );

    for (
      let index = 0;
      index < generatedHalls.length;
      index++
    ) {
      const hall =
        generatedHalls[index];

      const remainingHalls =
        generatedHalls.length -
        index;

      const capacityOfRemainingHalls =
        generatedHalls
          .slice(index + 1)
          .reduce(
            (sum, h) =>
              sum + h.capacity,
            0
          );

      const minimumForCurrentHall =
        Math.max(
          0,
          remainingStudents -
            capacityOfRemainingHalls
        );

      const desired =
        Math.ceil(
          remainingStudents /
            remainingHalls
        );

      const allocationCount =
        Math.min(
          hall.capacity,
          Math.max(
            desired,
            minimumForCurrentHall
          )
        );

      finalTargets[index] =
        allocationCount;

      remainingStudents -=
        allocationCount;
    }

    // ========================================================
    // FINAL CAPACITY SAFETY CHECK
    // ========================================================

    if (remainingStudents > 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Unable to distribute all students across the selected halls.",
      });
    }

    // ========================================================
    // ALLOCATE MIXED STUDENTS
    // ========================================================

    let studentIndex = 0;

    for (
      let hallIndex = 0;
      hallIndex < generatedHalls.length;
      hallIndex++
    ) {
      const hall =
        generatedHalls[hallIndex];

      const targetCount =
        finalTargets[hallIndex];

      // ======================================================
      // PUT MIXED STUDENTS INTO THIS HALL
      // ======================================================

      for (
        let i = 0;
        i < targetCount;
        i++
      ) {
        if (
          studentIndex >=
          mixedStudents.length
        ) {
          break;
        }

        const student =
          mixedStudents[studentIndex];

        // ====================================================
        // INSERT ALLOTMENT
        // ====================================================

        await connection.query(
          `
          INSERT INTO allotments
          (
            exam_id,
            student_id,
            hall_id,
            allocation_method
          )
          VALUES
          (?, ?, ?, 'automatic')
          `,
          [
            student.exam_id,
            student.student_id,
            hall.hall_id,
          ]
        );

        // ====================================================
        // ADD STUDENT TO HALL
        // ====================================================

        hall.students.push(student);

        hall.student_count++;

        // ====================================================
        // GROUP
        //
        // exam + year + department
        // ====================================================

        const groupKey = [
          student.exam_id,
          student.year,
          student.department_id,
        ].join("_");

        if (!hall.groups[groupKey]) {
          hall.groups[groupKey] = {
            exam_id:
              student.exam_id,

            exam_name:
              student.exam_name,

            subject_code:
              student.subject_code,

            subject_name:
              student.subject_name,

            year:
              student.year,

            department_id:
              student.department_id,

            department_name:
              student.department_name,

            department_code:
              student.department_code,

            register_numbers: [],

            student_count: 0,
          };
        }

        // ====================================================
        // ADD REGISTER NUMBER
        // ====================================================

        hall.groups[
          groupKey
        ].register_numbers.push(
          student.register_number
        );

        hall.groups[
          groupKey
        ].student_count++;

        studentIndex++;
      }
    }

    // ========================================================
    // SAFETY CHECK
    // ========================================================

    if (
      studentIndex !==
      mixedStudents.length
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Unable to allocate all students. Allocated: ${studentIndex}, Students: ${mixedStudents.length}`,
      });
    }

    // ========================================================
    // SORT REGISTER NUMBERS INSIDE GROUPS
    // ========================================================

    for (const hall of generatedHalls) {
      for (const group of Object.values(hall.groups)) {
        group.register_numbers.sort(
          (a, b) =>
            String(a).localeCompare(
              String(b),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              }
            )
        );
      }
    }

    // ========================================================
    // SORT STUDENTS INSIDE EACH HALL
    //
    // IMPORTANT:
    //
    // DO NOT sort by register number here.
    //
    // The current order is intentionally:
    //
    // Exam 1
    // Exam 2
    // Exam 1
    // Exam 2
    //
    // so the UI can display the mixed seating order.
    // ========================================================

    const result =
      generatedHalls.map(
        (hall) => ({
          hall_id:
            hall.hall_id,

          hall_name:
            hall.hall_name,

          hall_number:
            hall.hall_number,

          building:
            hall.building,

          floor:
            hall.floor,

          capacity:
            hall.capacity,

          student_count:
            hall.student_count,

          groups:
            Object.values(
              hall.groups
            ),

          students:
            hall.students.map(
              (student) => ({
                student_id:
                  student.student_id,

                register_number:
                  student.register_number,

                roll_number:
                  student.roll_number,

                full_name:
                  student.full_name,

                year:
                  student.year,

                section:
                  student.section,

                department_id:
                  student.department_id,

                department_name:
                  student.department_name,

                department_code:
                  student.department_code,

                exam_id:
                  student.exam_id,

                exam_name:
                  student.exam_name,

                subject_code:
                  student.subject_code,

                subject_name:
                  student.subject_name,
              })
            ),
        })
      );

    // ========================================================
    // COMMIT
    // ========================================================

    await connection.commit();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "Multi-exam mixed hall allotment generated successfully.",

      exam_ids:
        examIds,

      selected_exams:
        exams,

      total_students:
        totalStudents,

      total_halls:
        generatedHalls.length,

      total_capacity:
        totalCapacity,

      data:
        result,
    });

  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    console.error(
      "Generate allotment error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate allotment",

      error:
        error.message,

      code:
        error.code || null,

      sqlMessage:
        error.sqlMessage || null,
    });

  } finally {
    connection.release();
  }
};


// ============================================================
// GET EXISTING ALLOTMENT FOR EXAM
// GET /api/allotments/exam/:examId
// ============================================================

const getExamAllotments = async (
  req,
  res
) => {
  try {
    const examId =
      Number(req.params.examId);

    if (
      !Number.isInteger(examId) ||
      examId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid Exam ID is required",
      });
    }

    const [rows] =
      await db.query(
        `
        SELECT

          a.id,
          a.exam_id,
          a.student_id,
          a.hall_id,
          a.allocation_method,
          a.allotted_at,

          e.exam_name,
          e.subject_code,
          e.subject_name,
          e.exam_date,
          e.session,

          s.register_number,
          s.full_name,
          s.roll_number,
          s.year,
          s.section,
          s.department_id,

          d.name AS department_name,
          d.code AS department_code,

          h.hall_name,
          h.hall_number,
          h.building,
          h.floor,
          h.capacity

        FROM allotments a

        INNER JOIN exams e
          ON a.exam_id = e.id

        INNER JOIN students s
          ON a.student_id = s.id

        LEFT JOIN departments d
          ON s.department_id = d.id

        INNER JOIN halls h
          ON a.hall_id = h.id

        WHERE a.exam_id = ?

        ORDER BY
          h.id ASC,
          a.id ASC
        `,
        [examId]
      );

    return res.json({
      success: true,

      count:
        rows.length,

      data:
        rows,
    });

  } catch (error) {
    console.error(
      "Get allotments error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch allotments",

      error:
        error.message,
    });
  }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getStudentsForAllotment,

  generateAllotment,

  getExamAllotments,
};