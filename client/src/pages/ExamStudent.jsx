import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function ExamStudent() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // LOAD EXAMS
  // ============================================================

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/exams`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load exams");
      }

      setExams(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD STUDENTS
  // ============================================================

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/students`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load students");
      }

      setStudents(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  // ============================================================
  // EXAM CHANGE
  // ============================================================

  const handleExamChange = (event) => {
    const examId = event.target.value;

    setSelectedExam(examId);
    setSelectedStudents([]);
    setMessage("");
    setError("");

    if (examId) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  };

  // ============================================================
  // SELECT / UNSELECT STUDENT
  // ============================================================

  const toggleStudent = (studentId) => {
    setSelectedStudents((previous) => {
      if (previous.includes(studentId)) {
        return previous.filter((id) => id !== studentId);
      }

      return [...previous, studentId];
    });
  };

  // ============================================================
  // SELECT ALL
  // ============================================================

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id));
    }
  };

  // ============================================================
  // ADD STUDENTS TO EXAM
  // ============================================================

  const handleAddStudents = async () => {
    if (!selectedExam) {
      setError("Please select an exam.");
      return;
    }

    if (selectedStudents.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/exams/${selectedExam}/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_ids: selectedStudents,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to add students");
      }

      setMessage(
        result.message || "Students added to exam successfully."
      );

      setSelectedStudents([]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SELECTED EXAM
  // ============================================================

  const currentExam = exams.find(
    (exam) => String(exam.id) === String(selectedExam)
  );

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Exam Student Selection
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Select students who are attending the examination.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/allotment")}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Hall Allotment →
        </button>

      </div>


      {/* ======================================================
          ALERTS
      ======================================================= */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}


      {/* ======================================================
          EXAM SELECT
      ======================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Select Examination
        </label>

        <select
          value={selectedExam}
          onChange={handleExamChange}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >

          <option value="">
            -- Select Exam --
          </option>

          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.exam_name} - {exam.subject_name} -{" "}
              {exam.exam_date} ({exam.session})
            </option>
          ))}

        </select>

        {loading && (
          <p className="mt-2 text-sm text-slate-500">
            Loading exams...
          </p>
        )}

      </div>


      {/* ======================================================
          EXAM INFORMATION
      ======================================================= */}

      {currentExam && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">
              Subject
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {currentExam.subject_name}
            </p>
          </div>


          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">
              Date
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {currentExam.exam_date}
            </p>
          </div>


          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">
              Session
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {currentExam.session}
            </p>
          </div>


          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">
              Selected
            </p>

            <p className="mt-1 font-semibold text-blue-600">
              {selectedStudents.length}
            </p>
          </div>

        </div>
      )}


      {/* ======================================================
          STUDENTS
      ======================================================= */}

      {selectedExam && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TABLE HEADER */}

          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Students
              </h2>

              <p className="text-sm text-slate-500">
                {students.length} students available
              </p>
            </div>


            <div className="flex gap-2">

              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={students.length === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {selectedStudents.length === students.length
                  ? "Unselect All"
                  : "Select All"}
              </button>

              <button
                type="button"
                onClick={handleAddStudents}
                disabled={
                  loading ||
                  selectedStudents.length === 0
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Adding..."
                  : `Add ${selectedStudents.length} Students`}
              </button>

            </div>

          </div>


          {/* LOADING */}

          {loadingStudents && (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading students...
            </div>
          )}


          {/* NO STUDENTS */}

          {!loadingStudents && students.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              No students found.
            </div>
          )}


          {/* STUDENT TABLE */}

          {!loadingStudents && students.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="w-14 px-5 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          students.length > 0 &&
                          selectedStudents.length ===
                            students.length
                        }
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Register Number
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Year
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Section
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {students.map((student) => {

                    const isSelected =
                      selectedStudents.includes(student.id);

                    return (
                      <tr
                        key={student.id}
                        className={
                          isSelected
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }
                      >

                        <td className="px-5 py-4 text-center">

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleStudent(student.id)
                            }
                            className="h-4 w-4"
                          />

                        </td>


                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {student.register_number}
                        </td>


                        <td className="px-5 py-4 text-sm text-slate-700">
                          {student.full_name}
                        </td>


                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.department_name ||
                            student.department_code ||
                            "-"}
                        </td>


                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.year}
                        </td>


                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.section || "-"}
                        </td>

                      </tr>
                    );

                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default ExamStudent;