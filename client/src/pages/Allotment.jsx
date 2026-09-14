import { useEffect, useMemo, useState } from "react";

const API_URL = "https://exam-hall-allotment-api.onrender.com/api";

export default function Allotment() {
  const [exams, setExams] = useState([]);
  const [halls, setHalls] = useState([]);

  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedHalls, setSelectedHalls] = useState([]);

  const [examStudents, setExamStudents] = useState({});
  const [allStudents, setAllStudents] = useState([]);

  const [allotments, setAllotments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // MANAGE STUDENTS STATE
  // ============================================================

  const [manageExam, setManageExam] = useState(null);
  const [manageStudents, setManageStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadExams();
    loadHalls();
  }, []);

  // ============================================================
  // LOAD EXAMS
  // ============================================================

  const loadExams = async () => {
    try {
      const response = await fetch(`${API_URL}/exams`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load examinations"
        );
      }

      setExams(result.data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // LOAD HALLS
  // ============================================================

  const loadHalls = async () => {
    try {
      const response = await fetch(`${API_URL}/halls`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load halls"
        );
      }

      setHalls(
        (result.data || []).filter(
          (hall) => Number(hall.is_active) === 1
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // ============================================================
  // LOAD STUDENTS FOR EXAM
  // ============================================================

  const loadExamStudents = async (examId) => {
    try {
      const response = await fetch(
        `${API_URL}/allotments/exam/${examId}/students`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load exam students"
        );
      }

      const students = result.data || [];

      setExamStudents((previous) => ({
        ...previous,
        [examId]: students,
      }));

      return students;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  // ============================================================
  // LOAD ALL STUDENTS
  // ============================================================

  const loadAllStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/students`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load students"
        );
      }

      const students = result.data || [];

      setAllStudents(students);

      return students;
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  // ============================================================
  // MANAGE STUDENTS
  // ============================================================

  const openManageStudents = async (exam) => {
    setError("");
    setMessage("");
    setStudentSearch("");
    setManageExam(exam);

    try {
      setLoading(true);

      const [studentsForExam, students] = await Promise.all([
        loadExamStudents(Number(exam.id)),
        allStudents.length > 0
          ? Promise.resolve(allStudents)
          : loadAllStudents(),
      ]);

      setManageStudents(students);

      const ids = studentsForExam
        .map((student) =>
          Number(
            student.student_id ??
              student.id
          )
        )
        .filter((id) => !Number.isNaN(id));

      setSelectedStudentIds(ids);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CLOSE MANAGE STUDENTS
  // ============================================================

  const closeManageStudents = () => {
    setManageExam(null);
    setManageStudents([]);
    setStudentSearch("");
    setSelectedStudentIds([]);
  };

  // ============================================================
  // FILTER STUDENTS
  // ============================================================

  const filteredManageStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) {
      return manageStudents;
    }

    return manageStudents.filter((student) => {
      const registerNumber = String(
        student.register_number || ""
      ).toLowerCase();

      const fullName = String(
        student.full_name || student.name || ""
      ).toLowerCase();

      const department = String(
        student.department_code ||
          student.department_name ||
          ""
      ).toLowerCase();

      return (
        registerNumber.includes(search) ||
        fullName.includes(search) ||
        department.includes(search)
      );
    });
  }, [manageStudents, studentSearch]);

  // ============================================================
  // TOGGLE STUDENT
  // ============================================================

  const toggleStudent = (studentId) => {
    const id = Number(studentId);

    setSelectedStudentIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (studentId) => studentId !== id
        );
      }

      return [...previous, id];
    });
  };

  // ============================================================
  // SELECT ALL FILTERED
  // ============================================================

  const selectAllFilteredStudents = () => {
    const ids = filteredManageStudents
      .map((student) => Number(student.id))
      .filter((id) => !Number.isNaN(id));

    setSelectedStudentIds((previous) => {
      return Array.from(
        new Set([...previous, ...ids])
      );
    });
  };

  // ============================================================
  // CLEAR FILTERED
  // ============================================================

  const clearFilteredStudents = () => {
    const ids = new Set(
      filteredManageStudents.map((student) =>
        Number(student.id)
      )
    );

    setSelectedStudentIds((previous) =>
      previous.filter((id) => !ids.has(id))
    );
  };

  // ============================================================
  // SAVE EXAM STUDENTS
  // ============================================================

  const saveExamStudents = async () => {
    if (!manageExam) {
      return;
    }

    try {
      setSavingStudents(true);
      setError("");
      setMessage("");

      /*
       * IMPORTANT:
       * This endpoint must exist in your backend:
       *
       * PUT /api/exams/:examId/students
       *
       * Body:
       * {
       *   student_ids: [1,2,3,4]
       * }
       */

      const response = await fetch(
        `${API_URL}/exams/${manageExam.id}/students`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_ids: selectedStudentIds,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to save exam students"
        );
      }

      await loadExamStudents(
        Number(manageExam.id)
      );

      setMessage(
        `${selectedStudentIds.length} students assigned to ${manageExam.subject_name}.`
      );

      closeManageStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStudents(false);
    }
  };

  // ============================================================
  // SELECT / UNSELECT EXAM
  // ============================================================

  const toggleExam = async (examId) => {
    const id = Number(examId);

    setMessage("");
    setError("");

    if (selectedExams.includes(id)) {
      setSelectedExams((previous) =>
        previous.filter(
          (item) => item !== id
        )
      );

      return;
    }

    setSelectedExams((previous) => [
      ...previous,
      id,
    ]);

    if (!examStudents[id]) {
      await loadExamStudents(id);
    }
  };

  // ============================================================
  // SELECT ALL EXAMS
  // ============================================================

  const selectAllExams = async () => {
    const ids = exams.map((exam) =>
      Number(exam.id)
    );

    setSelectedExams(ids);

    for (const id of ids) {
      if (!examStudents[id]) {
        await loadExamStudents(id);
      }
    }
  };

  // ============================================================
  // CLEAR EXAMS
  // ============================================================

  const clearExams = () => {
    setSelectedExams([]);
    setAllotments([]);
    setMessage("");
    setError("");
  };

  // ============================================================
  // SELECT / UNSELECT HALL
  // ============================================================

  const toggleHall = (hallId) => {
    const id = Number(hallId);

    setSelectedHalls((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [...previous, id];
    });

    setMessage("");
    setError("");
  };

  // ============================================================
  // TOTAL SELECTED STUDENTS
  // ============================================================

  const totalSelectedStudents =
    selectedExams.reduce(
      (total, examId) =>
        total +
        (examStudents[examId] || []).length,
      0
    );

  // ============================================================
  // TOTAL HALL CAPACITY
  // ============================================================

  const totalCapacity = halls
    .filter((hall) =>
      selectedHalls.includes(
        Number(hall.id)
      )
    )
    .reduce(
      (total, hall) =>
        total +
        Number(hall.capacity || 0),
      0
    );

  // ============================================================
  // GENERATE
  // ============================================================

  const generateAllotment = async () => {
    setMessage("");
    setError("");

    if (selectedExams.length === 0) {
      setError(
        "Please select at least one examination."
      );
      return;
    }

    if (selectedHalls.length === 0) {
      setError(
        "Please select at least one examination hall."
      );
      return;
    }

    for (const examId of selectedExams) {
      if (
        !examStudents[examId] ||
        examStudents[examId].length === 0
      ) {
        const exam = exams.find(
          (item) =>
            Number(item.id) ===
            Number(examId)
        );

        setError(
          `No students are registered for ${
            exam?.subject_name ||
            "this examination"
          }. Click "Manage Students" and assign students.`
        );

        return;
      }
    }

    if (totalSelectedStudents > totalCapacity) {
      setError(
        `Not enough hall capacity. Students: ${totalSelectedStudents}, Capacity: ${totalCapacity}`
      );

      return;
    }

    try {
      setGenerating(true);

      const response = await fetch(
        `${API_URL}/allotments/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            exam_ids: selectedExams,
            hall_ids: selectedHalls,
          }),
        }
      );

      const result =
        await response.json();

        if (!response.ok || !result.success) {
          console.error("BACKEND ALLOTMENT ERROR:", result);

          throw new Error(
            result.sqlMessage ||
            result.error ||
            result.message ||
            "Failed to generate allotment"
          );
        }

      setAllotments(
        result.data || []
      );

      setMessage(
        result.message ||
          "Hall allotment generated successfully."
      );
    } catch (err) {
      console.error(
        "Generate allotment error:",
        err
      );

      setError(
        err.message ||
          "Failed to generate allotment"
      );
    } finally {
      setGenerating(false);
    }
  };

  // ============================================================
  // REGISTER NUMBER FORMAT
  // ============================================================

  const formatRegisterNumbers = (numbers) => {
    if (
      !numbers ||
      numbers.length === 0
    ) {
      return "-";
    }

    return numbers.join(", ");
  };

// ============================================================
// DOWNLOAD HTML
// ============================================================

const downloadHTML = () => {
  if (allotments.length === 0) {
    return;
  }

  let tables = "";

  allotments.forEach((hall) => {

    // ========================================================
    // HALL HEADING
    // ========================================================

    tables += `
      <div class="hall-section">

        <div class="hall-title">
          ${hall.hall_name || `HALL ${hall.hall_number}`}
        </div>

        <div class="hall-subtitle">
          Hall Number: ${hall.hall_number}
        </div>

        <table>

          <thead>

            <tr>
              <th>YEAR</th>
              <th>PROGRAMME</th>
              <th>LIST OF STUDENTS REGISTERED</th>
              <th>HALL NUMBER</th>
              <th>TOTAL</th>
            </tr>

          </thead>

          <tbody>
    `;

    // ========================================================
    // STUDENT GROUPS
    // ========================================================

    hall.groups.forEach((group) => {

      tables += `
        <tr>

          <td>
            ${group.year || "-"}
          </td>

          <td>
            ${
              group.department_code ||
              group.department_name ||
              "-"
            }
          </td>

          <td>
            <strong>
              ${group.subject_name || "-"}
              ${
                group.subject_code
                  ? ` (${group.subject_code})`
                  : ""
              }
            </strong>

            <br/>

            ${formatRegisterNumbers(
              group.register_numbers
            )}
          </td>

          <td>
            ${hall.hall_number}
          </td>

          <td>
            ${group.student_count}
          </td>

        </tr>
      `;
    });

    // ========================================================
    // TOTAL ROW
    // ========================================================

    tables += `
        <tr class="hall-total">

          <td colspan="4">
            TOTAL
          </td>

          <td>
            ${hall.student_count}
          </td>

        </tr>

          </tbody>

        </table>

      </div>
    `;
  });

  // ==========================================================
  // COMPLETE HTML
  // ==========================================================

  const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8"/>

<title>Hall Allotment</title>

<style>

body {
  font-family: Arial, sans-serif;
  margin: 30px;
  color: #111;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  font-size: 20px;
}

.header h2 {
  margin: 6px 0;
  font-size: 16px;
}

.header p {
  margin: 3px 0;
  font-size: 12px;
}

/* ==========================================================
   EACH HALL SECTION
   ========================================================== */

.hall-section {
  margin-bottom: 35px;
  page-break-inside: avoid;
}

/* ==========================================================
   HALL NAME AT TOP
   ========================================================== */

.hall-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
  text-transform: uppercase;
}

/* ==========================================================
   HALL NUMBER
   ========================================================== */

.hall-subtitle {
  text-align: center;
  font-size: 12px;
  margin-bottom: 10px;
  color: #444;
}

/* ==========================================================
   TABLE
   ========================================================== */

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

th,
td {
  border: 1px solid #333;
  padding: 7px;
  vertical-align: top;
}

th {
  text-align: center;
  background: #eee;
}

/* ==========================================================
   TOTAL
   ========================================================== */

.hall-total {
  font-weight: bold;
  background: #f3f3f3;
}

.hall-total td:first-child {
  text-align: right;
}

/* ==========================================================
   PRINT
   ========================================================== */

@media print {

  body {
    margin: 10mm;
  }

  .hall-section {
    page-break-inside: avoid;
  }

}

</style>

</head>

<body>

<div class="header">

  <h1>
    EXAMINATION HALL ALLOTMENT
  </h1>

  <h2>
    LIST OF STUDENTS REGISTERED FOR EXAMINATION
  </h2>

  <p>
    Selected Examinations:
    ${selectedExams.length}
  </p>

  <p>
    Selected Halls:
    ${selectedHalls.length}
  </p>

</div>

${tables}

</body>

</html>
`;

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const blob = new Blob(
    [html],
    {
      type: "text/html",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "Hall-Allotment.html";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
};

  // ============================================================
  // PRINT
  // ============================================================

  const printAllotment = () => {
    if (allotments.length === 0) {
      return;
    }

    window.print();
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hall Allotment
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Select examinations, manage students,
          select halls and generate the allotment.
        </p>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ======================================================
          EXAMS
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-bold text-slate-900">
              1. Select Examinations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select multiple subjects for one allotment.
              Use Manage Students to change students.
            </p>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={selectAllExams}
              className="rounded-lg border border-blue-500 px-3 py-2 text-sm font-semibold text-blue-600"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={clearExams}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              Clear
            </button>

          </div>

        </div>

        <div className="mt-5 space-y-3">

          {exams.map((exam) => {
            const id = Number(exam.id);

            const selected =
              selectedExams.includes(id);

            const count =
              (
                examStudents[id] ||
                []
              ).length;

            return (
              <div
                key={exam.id}
                className={`rounded-xl border p-4 ${
                  selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  {/* EXAM INFO */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleExam(id)
                    }
                    className="flex-1 text-left"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <p className="font-bold text-slate-900">

                          {exam.subject_name}

                          {exam.subject_code
                            ? ` (${exam.subject_code})`
                            : ""}

                        </p>

                        <p className="mt-1 text-sm text-slate-500">

                          Exam:
                          {" "}
                          {exam.exam_name}

                          {" • "}

                          {exam.exam_date}

                          {" • "}

                          {exam.session}

                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-lg font-bold text-blue-600">
                          {count}
                        </p>

                        <p className="text-xs text-slate-500">
                          Students
                        </p>

                      </div>

                    </div>

                    {selected && (
                      <p className="mt-3 text-sm font-semibold text-blue-600">
                        ✓ Examination Selected
                      </p>
                    )}

                  </button>

                  {/* MANAGE STUDENTS */}

                  <button
                    type="button"
                    onClick={() =>
                      openManageStudents(exam)
                    }
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Manage Students
                  </button>

                </div>

              </div>
            );
          })}

          {exams.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No examinations found.
            </div>
          )}

        </div>

      </div>

      {/* ======================================================
          SELECTED EXAM SUMMARY
      ====================================================== */}

      {selectedExams.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <h3 className="font-bold text-blue-900">
            Selected Examinations
          </h3>

          <div className="mt-3 space-y-2">

            {selectedExams.map((id) => {
              const exam =
                exams.find(
                  (item) =>
                    Number(item.id) === id
                );

              return (
                <div
                  key={id}
                  className="flex justify-between rounded-lg bg-white px-4 py-3"
                >

                  <span className="font-medium">
                    {exam?.subject_name}
                  </span>

                  <span className="font-bold text-blue-600">
                    {
                      (
                        examStudents[id] ||
                        []
                      ).length
                    }
                  </span>

                </div>
              );
            })}

          </div>

          <div className="mt-4 border-t border-blue-200 pt-3 font-bold text-blue-900">

            Total Students:
            {" "}
            {totalSelectedStudents}

          </div>

        </div>
      )}

      {/* ======================================================
          HALLS
      ====================================================== */}

      {selectedExams.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="font-bold text-slate-900">
            2. Select Examination Halls
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            One hall can contain students from different examinations.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {halls.map((hall) => {
              const id = Number(hall.id);

              const selected =
                selectedHalls.includes(id);

              return (
                <button
                  key={hall.id}
                  type="button"
                  onClick={() =>
                    toggleHall(id)
                  }
                  className={`rounded-xl border p-4 text-left ${
                    selected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white"
                  }`}
                >

                  <div className="flex justify-between">

                    <div>

                      <p className="font-bold">
                        {hall.hall_name}
                      </p>

                      <p className="text-sm text-slate-500">
                        Hall {hall.hall_number}
                      </p>

                    </div>

                    {selected && (
                      <span className="font-bold text-blue-600">
                        ✓
                      </span>
                    )}

                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3">

                    <p className="text-xs text-slate-500">
                      Capacity
                    </p>

                    <p className="font-bold">
                      {hall.capacity}
                    </p>

                  </div>

                </button>
              );
            })}

          </div>

        </div>
      )}

      {/* ======================================================
          GENERATE
      ====================================================== */}

      {selectedExams.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="font-bold">
                Ready to Generate
              </p>

              <p className="text-sm text-slate-500">

                {selectedExams.length}
                {" "}
                exams •
                {" "}
                {totalSelectedStudents}
                {" "}
                students •
                {" "}
                {selectedHalls.length}
                {" "}
                halls

              </p>

              <p className="mt-1 text-xs text-slate-500">

                Capacity:
                {" "}
                {totalCapacity}

              </p>

            </div>

            <button
              type="button"
              onClick={generateAllotment}
              disabled={
                generating ||
                selectedExams.length === 0 ||
                selectedHalls.length === 0
              }
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {generating
                ? "Generating..."
                : "Generate Hall Allotment"}
            </button>

          </div>

        </div>
      )}

      {/* ======================================================
          RESULT
      ====================================================== */}

      {allotments.length > 0 && (
        <div className="space-y-5">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Hall Allotment
              </h2>

              <p className="text-sm text-slate-500">
                Multiple examinations combined in the same halls.
              </p>

            </div>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={downloadHTML}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Download
              </button>

              <button
                type="button"
                onClick={printAllotment}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Print / PDF
              </button>

            </div>

          </div>

          {allotments.map((hall) => (
            <div
              key={hall.hall_id}
              className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm"
            >

              <div className="border-b border-slate-300 bg-slate-50 p-4">

                <div className="flex justify-between">

                  <div>

                    <h3 className="text-lg font-bold">
                      {hall.hall_name}
                    </h3>

                    <p className="text-sm text-slate-500">
                      Hall Number:
                      {" "}
                      {hall.hall_number}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-xs text-slate-500">
                      Total
                    </p>

                    <p className="text-xl font-bold">
                      {hall.student_count}
                    </p>

                  </div>

                </div>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px] border-collapse">

                  <thead>

                    <tr className="bg-slate-100">

                      <th className="border border-slate-300 px-4 py-3 text-left text-xs font-bold">
                        YEAR
                      </th>

                      <th className="border border-slate-300 px-4 py-3 text-left text-xs font-bold">
                        PROGRAMME
                      </th>

                      <th className="border border-slate-300 px-4 py-3 text-left text-xs font-bold">
                        LIST OF STUDENTS REGISTERED
                      </th>

                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-bold">
                        HALL NUMBER
                      </th>

                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-bold">
                        TOTAL
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {hall.groups.map(
                      (group, index) => (
                        <tr
                          key={`${group.exam_id}-${group.department_id}-${group.year}-${index}`}
                        >

                          <td className="border border-slate-300 px-4 py-3 font-semibold">
                            {group.year}
                          </td>

                          <td className="border border-slate-300 px-4 py-3">

                            <div className="font-semibold">
                              {
                                group.department_code ||
                                group.department_name ||
                                "-"
                              }
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {group.subject_name}

                              {group.subject_code
                                ? ` (${group.subject_code})`
                                : ""}
                            </div>

                          </td>

                          <td className="border border-slate-300 px-4 py-3">

                            <div className="leading-6">
                              {formatRegisterNumbers(
                                group.register_numbers
                              )}
                            </div>

                          </td>

                          <td className="border border-slate-300 px-4 py-3 text-center font-semibold">
                            {hall.hall_number}
                          </td>

                          <td className="border border-slate-300 px-4 py-3 text-center font-bold">
                            {group.student_count}
                          </td>

                        </tr>
                      )
                    )}

                    <tr>

                      <td
                        colSpan="4"
                        className="border border-slate-300 bg-slate-100 px-4 py-3 text-right font-bold"
                      >
                        TOTAL
                      </td>

                      <td className="border border-slate-300 bg-slate-100 px-4 py-3 text-center font-bold">
                        {hall.student_count}
                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* ======================================================
          MANAGE STUDENTS MODAL
      ====================================================== */}

      {manageExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Manage Students
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {manageExam.subject_name}

                  {manageExam.subject_code
                    ? ` (${manageExam.subject_code})`
                    : ""}

                  {" • "}

                  {manageExam.exam_date}

                  {" • "}

                  {manageExam.session}
                </p>

              </div>

              <button
                type="button"
                onClick={closeManageStudents}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>

            </div>

            {/* SEARCH */}

            <div className="border-b border-slate-200 bg-slate-50 p-4">

              <div className="flex flex-col gap-3 md:flex-row">

                <input
                  type="text"
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search register number, student name or department..."
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={
                    selectAllFilteredStudents
                  }
                  className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={
                    clearFilteredStudents
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Clear
                </button>

              </div>

              <div className="mt-3 flex justify-between text-sm">

                <span className="text-slate-500">
                  Showing{" "}
                  {filteredManageStudents.length}
                  {" "}
                  students
                </span>

                <span className="font-bold text-blue-600">
                  Selected:{" "}
                  {selectedStudentIds.length}
                </span>

              </div>

            </div>

            {/* STUDENT LIST */}

            <div className="flex-1 overflow-y-auto p-4">

              {loading ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Loading students...
                </div>
              ) : filteredManageStudents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                  No students found.
                </div>
              ) : (
                <div className="space-y-2">

                  {filteredManageStudents.map(
                    (student) => {

                      const studentId =
                        Number(student.id);

                      const checked =
                        selectedStudentIds.includes(
                          studentId
                        );

                      return (
                        <label
                          key={student.id}
                          className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 ${
                            checked
                              ? "border-blue-400 bg-blue-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleStudent(
                                studentId
                              )
                            }
                            className="h-5 w-5"
                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                              <div>

                                <p className="font-bold text-slate-900">
                                  {
                                    student.register_number ||
                                    "-"
                                  }
                                </p>

                                <p className="text-sm text-slate-600">
                                  {
                                    student.full_name ||
                                    student.name ||
                                    "-"
                                  }
                                </p>

                              </div>

                              <div className="text-left sm:text-right">

                                <p className="text-sm font-semibold text-slate-700">
                                  {
                                    student.department_code ||
                                    student.department_name ||
                                    "-"
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  Year{" "}
                                  {student.year ||
                                    "-"}
                                </p>

                              </div>

                            </div>

                          </div>

                        </label>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="font-bold text-slate-900">
                  {selectedStudentIds.length}
                  {" "}
                  Students Selected
                </p>

                <p className="text-xs text-slate-500">
                  These students will attend this examination.
                </p>

              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    closeManageStudents
                  }
                  className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveExamStudents
                  }
                  disabled={savingStudents}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {savingStudents
                    ? "Saving..."
                    : "Save Students"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
