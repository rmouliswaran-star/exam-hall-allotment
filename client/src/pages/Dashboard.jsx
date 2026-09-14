import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [halls, setHalls] = useState([]);
  const [exams, setExams] = useState([]);

  const [examStudentCounts, setExamStudentCounts] = useState({});
  const [examAllotments, setExamAllotments] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        studentsResponse,
        departmentsResponse,
        hallsResponse,
        examsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/students`),
        fetch(`${API_URL}/departments`),
        fetch(`${API_URL}/halls`),
        fetch(`${API_URL}/exams`),
      ]);

      const studentsData = await studentsResponse.json();
      const departmentsData = await departmentsResponse.json();
      const hallsData = await hallsResponse.json();
      const examsData = await examsResponse.json();

      if (!studentsResponse.ok) {
        throw new Error(
          studentsData.message || "Failed to load students"
        );
      }

      if (!departmentsResponse.ok) {
        throw new Error(
          departmentsData.message || "Failed to load departments"
        );
      }

      if (!hallsResponse.ok) {
        throw new Error(
          hallsData.message || "Failed to load halls"
        );
      }

      if (!examsResponse.ok) {
        throw new Error(
          examsData.message || "Failed to load examinations"
        );
      }

      setStudents(
        Array.isArray(studentsData)
          ? studentsData
          : studentsData.data || []
      );

      setDepartments(
        Array.isArray(departmentsData)
          ? departmentsData
          : departmentsData.data || []
      );

      setHalls(
        Array.isArray(hallsData)
          ? hallsData
          : hallsData.data || []
      );

      const loadedExams = Array.isArray(examsData)
        ? examsData
        : examsData.data || [];

      setExams(loadedExams);

      // ========================================================
      // LOAD STUDENT + ALLOTMENT DATA FOR EACH EXAM
      // ========================================================

      const studentCounts = {};
      const allotmentData = {};

      await Promise.all(
        loadedExams.map(async (exam) => {
          try {
            const response = await fetch(
              `${API_URL}/allotments/exam/${exam.id}/students`
            );

            if (response.ok) {
              const data = await response.json();

              const examStudents = Array.isArray(data)
                ? data
                : data.data || [];

              studentCounts[exam.id] = examStudents.length;
            } else {
              studentCounts[exam.id] = 0;
            }
          } catch {
            studentCounts[exam.id] = 0;
          }

          // ----------------------------------------------------
          // GET EXISTING ALLOTMENTS
          // ----------------------------------------------------

          try {
            const response = await fetch(
              `${API_URL}/allotments/exam/${exam.id}`
            );

            if (response.ok) {
              const data = await response.json();

              const allotments = Array.isArray(data)
                ? data
                : data.data || [];

              allotmentData[exam.id] = allotments;
            } else {
              allotmentData[exam.id] = [];
            }
          } catch {
            allotmentData[exam.id] = [];
          }
        })
      );

      setExamStudentCounts(studentCounts);
      setExamAllotments(allotmentData);
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const activeStudents = students.filter(
    (student) =>
      student.is_active === 1 ||
      student.is_active === true ||
      student.is_active === undefined
  ).length;

  const activeDepartments = departments.filter(
    (department) =>
      department.is_active === 1 ||
      department.is_active === true ||
      department.is_active === undefined
  ).length;

  const activeHalls = halls.filter(
    (hall) =>
      hall.is_active === 1 ||
      hall.is_active === true ||
      hall.is_active === undefined
  );

  const upcomingExams = exams.filter((exam) => {
    if (!exam.exam_date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = new Date(exam.exam_date);
    examDate.setHours(0, 0, 0, 0);

    return examDate >= today;
  });

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // EXAM STATUS
  // ============================================================

  const getExamStatus = (exam) => {
    const allotments =
      examAllotments[exam.id] || [];

    const studentCount =
      examStudentCounts[exam.id] || 0;

    if (allotments.length > 0) {
      return {
        label: "Allotted",
        type: "ready",
      };
    }

    if (studentCount > 0) {
      return {
        label: "Pending",
        type: "pending",
      };
    }

    return {
      label: exam.status || "Scheduled",
      type: "scheduled",
    };
  };

  // ============================================================
  // RECENT EXAMS
  // ============================================================

  const displayedExams = [...upcomingExams]
    .sort((a, b) => {
      return (
        new Date(a.exam_date) -
        new Date(b.exam_date)
      );
    })
    .slice(0, 5);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 font-medium text-slate-600">
            Loading dashboard...
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Fetching live examination data
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="w-full">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Live overview of examination activities and hall allotments.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={loadDashboard}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ↻ Refresh
          </button>

          <NavLink
            to="/admin/exams"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + New Examination
          </NavLink>

        </div>

      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

          <p className="font-semibold text-red-800">
            Dashboard data could not be loaded
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>

        </div>
      )}

      {/* ========================================================
          LIVE STATISTICS
      ======================================================== */}

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Students"
          value={activeStudents}
          description="Active students"
          icon="👨‍🎓"
          link="/admin/students"
        />

        <StatCard
          title="Departments"
          value={activeDepartments}
          description="Active departments"
          icon="🏢"
          link="/admin/departments"
        />

        <StatCard
          title="Examination Halls"
          value={activeHalls.length}
          description={`${activeHalls.reduce(
            (total, hall) =>
              total + Number(hall.capacity || 0),
            0
          )} total seats`}
          icon="🏫"
          link="/admin/halls"
        />

        <StatCard
          title="Upcoming Exams"
          value={upcomingExams.length}
          description="Scheduled examinations"
          icon="📝"
          link="/admin/exams"
        />

      </div>

      {/* ========================================================
          UPCOMING EXAMS + QUICK ACTIONS
      ======================================================== */}

      <div className="mt-6 grid w-full grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ======================================================
            UPCOMING EXAMS
        ====================================================== */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-200 p-6">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Upcoming Examinations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Live examination schedule
              </p>
            </div>

            <NavLink
              to="/admin/exams"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View all
            </NavLink>

          </div>

          {displayedExams.length === 0 ? (
            <div className="p-10 text-center">

              <div className="text-4xl">
                📝
              </div>

              <p className="mt-3 font-semibold text-slate-700">
                No upcoming examinations
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create an examination to see it here.
              </p>

              <NavLink
                to="/admin/exams"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Exam
              </NavLink>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-4">
                      Examination
                    </th>

                    <th className="px-6 py-4">
                      Date
                    </th>

                    <th className="px-6 py-4">
                      Session
                    </th>

                    <th className="px-6 py-4">
                      Students
                    </th>

                    <th className="px-6 py-4">
                      Allotment
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {displayedExams.map((exam) => {
                    const examStatus =
                      getExamStatus(exam);

                    return (
                      <ExamRow
                        key={exam.id}
                        exam={exam}
                        students={
                          examStudentCounts[
                            exam.id
                          ] || 0
                        }
                        status={
                          examStatus.label
                        }
                        statusType={
                          examStatus.type
                        }
                        formatDate={formatDate}
                      />
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Examination management
          </p>

          <div className="mt-6 space-y-3">

            <QuickAction
              to="/admin/students"
              icon="👨‍🎓"
              title="Manage Students"
              description="Add or import students"
            />

            <QuickAction
              to="/admin/halls"
              icon="🏫"
              title="Manage Halls"
              description="Configure examination halls"
            />

            <QuickAction
              to="/admin/exams"
              icon="📝"
              title="Manage Exams"
              description="Create and schedule exams"
            />

            <QuickAction
              to="/admin/allotment"
              icon="🎯"
              title="Generate Allotment"
              description="Assign students to halls"
            />

          </div>

        </div>

      </div>

      {/* ========================================================
          HALL SUMMARY
      ======================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Examination Hall Capacity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live hall availability
            </p>
          </div>

          <NavLink
            to="/admin/halls"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Manage Halls →
          </NavLink>

        </div>

        {activeHalls.length === 0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center">

            <p className="font-semibold text-slate-700">
              No active examination halls
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Add halls before generating allotments.
            </p>

          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {activeHalls.slice(0, 8).map((hall) => (
              <div
                key={hall.id}
                className="rounded-xl bg-slate-50 p-5"
              >

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Hall
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {hall.hall_number}
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                    {hall.capacity} seats
                  </span>

                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {hall.hall_name || "Examination Hall"}
                </p>

                {hall.building && (
                  <p className="mt-1 text-xs text-slate-500">
                    {hall.building}
                    {hall.floor
                      ? ` · Floor ${hall.floor}`
                      : ""}
                  </p>
                )}

              </div>
            ))}

          </div>
        )}

      </div>

      {/* ========================================================
          RECENT ALLOTMENTS
      ======================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Hall Allotment Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current allotment information from the database
            </p>
          </div>

          <NavLink
            to="/admin/allotment"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Open Allotment →
          </NavLink>

        </div>

        {upcomingExams.length === 0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            No examination allotments available.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

            {upcomingExams
              .slice(0, 6)
              .map((exam) => {
                const allotments =
                  examAllotments[exam.id] || [];

                const students =
                  examStudentCounts[exam.id] || 0;

                let status = "Not Generated";
                let statusType = "pending";

                if (allotments.length > 0) {
                  status = "Generated";
                  statusType = "completed";
                } else if (students > 0) {
                  status = "Ready to Generate";
                  statusType = "ready";
                }

                return (
                  <AllotmentCard
                    key={exam.id}
                    name={
                      exam.exam_name ||
                      exam.subject_name ||
                      "Examination"
                    }
                    date={`${formatDate(
                      exam.exam_date
                    )} · ${
                      exam.session || "-"
                    }`}
                    students={`${students} Students`}
                    status={status}
                    statusType={statusType}
                  />
                );
              })}

          </div>
        )}

      </div>

    </div>
  );
}


/* ================================================================
   STAT CARD
================================================================ */

function StatCard({
  title,
  value,
  description,
  icon,
  link,
}) {
  return (
    <NavLink
      to={link}
      className="block min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >

      <div className="flex items-start justify-between">

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </h2>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {description}
          </p>

        </div>

        <div className="ml-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
          {icon}
        </div>

      </div>

    </NavLink>
  );
}


/* ================================================================
   EXAM ROW
================================================================ */

function ExamRow({
  exam,
  students,
  status,
  statusType,
  formatDate,
}) {
  const statusClasses = {
    scheduled: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
  };

  return (
    <tr className="transition hover:bg-slate-50">

      <td className="px-6 py-4">

        <p className="font-semibold text-slate-800">
          {exam.exam_name ||
            exam.subject_name ||
            "Examination"}
        </p>

        <p className="text-xs text-slate-500">
          {exam.subject_code || "-"}
          {exam.academic_year
            ? ` · ${exam.academic_year}`
            : ""}
        </p>

      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
        {formatDate(exam.exam_date)}
      </td>

      <td className="px-6 py-4 text-sm font-medium text-slate-600">
        {exam.session || "-"}
      </td>

      <td className="px-6 py-4 text-sm text-slate-600">
        {students}
      </td>

      <td className="px-6 py-4">

        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
            statusClasses[statusType] ||
            "bg-slate-100 text-slate-600"
          }`}
        >
          {status}
        </span>

      </td>

    </tr>
  );
}


/* ================================================================
   QUICK ACTION
================================================================ */

function QuickAction({
  to,
  icon,
  title,
  description,
}) {
  return (
    <NavLink
      to={to}
      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="font-semibold text-slate-800">
          {title}
        </p>

        <p className="text-xs text-slate-500">
          {description}
        </p>

      </div>

    </NavLink>
  );
}


/* ================================================================
   ALLOTMENT CARD
================================================================ */

function AllotmentCard({
  name,
  date,
  students,
  status,
  statusType,
}) {
  const statusClasses = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    ready: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-5 transition hover:bg-slate-100">

      <p className="font-semibold text-slate-800">
        {name}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {date}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">

        <span className="text-sm text-slate-600">
          {students}
        </span>

        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
            statusClasses[statusType] ||
            "bg-slate-100 text-slate-600"
          }`}
        >
          {status}
        </span>

      </div>

    </div>
  );
}


export default Dashboard;