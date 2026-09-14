import { useEffect, useMemo, useState } from "react";

const API_URL = "https://exam-hall-allotment-api.onrender.com/api/exams";

function Exams() {
  // =========================================================
  // STATE
  // =========================================================

  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);

  const [search, setSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // FORM STATE
  // =========================================================

  const [examName, setExamName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [session, setSession] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState("scheduled");

  // =========================================================
  // FETCH EXAMS
  // =========================================================

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch exams");
      }

      setExams(result.data || []);
    } catch (err) {
      console.error("Fetch exams error:", err);

      setError(
        "Unable to load exams. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setExamName("");
    setSubjectCode("");
    setSubjectName("");
    setExamDate("");
    setSession("");
    setStartTime("");
    setEndTime("");
    setDurationMinutes("");
    setAcademicYear("");
    setSemester("");
    setStatus("scheduled");
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    resetForm();

    setEditingExam(null);
    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (exam) => {
    setEditingExam(exam);

    setExamName(exam.exam_name || "");
    setSubjectCode(exam.subject_code || "");
    setSubjectName(exam.subject_name || "");
    setExamDate(
      exam.exam_date
        ? String(exam.exam_date).substring(0, 10)
        : ""
    );
    setSession(exam.session || "");
    setStartTime(
      exam.start_time
        ? String(exam.start_time).substring(0, 5)
        : ""
    );
    setEndTime(
      exam.end_time
        ? String(exam.end_time).substring(0, 5)
        : ""
    );
    setDurationMinutes(
      exam.duration_minutes || ""
    );
    setAcademicYear(exam.academic_year || "");
    setSemester(exam.semester || "");
    setStatus(exam.status || "scheduled");

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingExam(null);

    setError("");
    setSuccess("");

    resetForm();
  };

  // =========================================================
  // SUBMIT EXAM
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!examName.trim()) {
      setError("Exam name is required.");
      return;
    }

    if (!subjectName.trim()) {
      setError("Subject name is required.");
      return;
    }

    if (!examDate) {
      setError("Exam date is required.");
      return;
    }

    if (!session) {
      setError("Please select an exam session.");
      return;
    }

    const data = {
      exam_name: examName.trim(),
      subject_code: subjectCode.trim() || null,
      subject_name: subjectName.trim(),
      exam_date: examDate,
      session,
      start_time: startTime || null,
      end_time: endTime || null,
      duration_minutes: durationMinutes
        ? Number(durationMinutes)
        : null,
      academic_year: academicYear.trim() || null,
      semester: semester.trim() || null,
      status,
    };

    try {
      setSaving(true);

      const url = editingExam
        ? `${API_URL}/${editingExam.id}`
        : API_URL;

      const method = editingExam ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${
              editingExam ? "update" : "create"
            } exam`
        );
      }

      setSuccess(
        editingExam
          ? "Exam updated successfully."
          : "Exam added successfully."
      );

      await fetchExams();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error("Save exam error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SELECT SINGLE EXAM
  // =========================================================

  const toggleSelect = (id) => {
    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (selectedId) => selectedId !== id
        );
      }

      return [...previous, id];
    });
  };

  // =========================================================
  // SELECT ALL CURRENT PAGE
  // =========================================================

  const toggleSelectAll = () => {
    const pageIds = paginatedExams.map(
      (exam) => exam.id
    );

    const allSelected = pageIds.every((id) =>
      selectedIds.includes(id)
    );

    if (allSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) => !pageIds.includes(id)
        )
      );
    } else {
      setSelectedIds((previous) => [
        ...new Set([
          ...previous,
          ...pageIds,
        ]),
      ]);
    }
  };

  // =========================================================
  // DELETE EXAM
  // =========================================================

  const deleteExam = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this exam?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to delete exam"
        );
      }

      setSelectedIds((previous) =>
        previous.filter(
          (selectedId) => selectedId !== id
        )
      );

      setSuccess("Exam deleted successfully.");

      await fetchExams();
    } catch (err) {
      console.error("Delete exam error:", err);

      setError(
        err.message || "Failed to delete exam."
      );
    }
  };

  // =========================================================
  // DELETE SELECTED EXAMS
  // =========================================================

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected exam${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      for (const id of selectedIds) {
        const response = await fetch(
          `${API_URL}/${id}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to delete selected exams"
          );
        }
      }

      setSelectedIds([]);

      setSuccess(
        "Selected exams deleted successfully."
      );

      await fetchExams();
    } catch (err) {
      console.error(
        "Delete selected exams error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete selected exams."
      );
    }
  };

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredExams = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return exams.filter((exam) => {
      const matchesSearch =
        !searchText ||
        String(exam.exam_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(exam.subject_code || "")
          .toLowerCase()
          .includes(searchText) ||
        String(exam.subject_name || "")
          .toLowerCase()
          .includes(searchText);

      const matchesSession =
        !sessionFilter ||
        exam.session === sessionFilter;

      const matchesStatus =
        !statusFilter ||
        exam.status === statusFilter;

      return (
        matchesSearch &&
        matchesSession &&
        matchesStatus
      );
    });
  }, [
    exams,
    search,
    sessionFilter,
    statusFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredExams.length / ITEMS_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedExams = filteredExams.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    sessionFilter,
    statusFilter,
  ]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const value = String(date).substring(
      0,
      10
    );

    const parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const getStatusClass = (value) => {
    switch (value) {
      case "scheduled":
        return "bg-blue-50 text-blue-700";

      case "ongoing":
        return "bg-yellow-50 text-yellow-700";

      case "completed":
        return "bg-green-50 text-green-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  // =========================================================
  // SELECTED COUNT
  // =========================================================

  const selectedCount = selectedIds.length;

  const allCurrentPageSelected =
    paginatedExams.length > 0 &&
    paginatedExams.every((exam) =>
      selectedIds.includes(exam.id)
    );

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Exams
          </h1>

          <p className="mt-2 text-slate-500">
            Manage examinations and their schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="mr-2 text-lg">
            +
          </span>

          Add Exam
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && !showModal && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4">

          <div>
            <p className="font-semibold text-red-700">
              Exam problem
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchExams}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          SEARCH + FILTER CARD
      ====================================================== */}

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

          {/* SEARCH */}

          <div className="md:col-span-2">

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search exam, subject code or subject name..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

          </div>

          {/* SESSION */}

          <div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Session
            </label>

            <select
              value={sessionFilter}
              onChange={(e) =>
                setSessionFilter(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500"
            >

              <option value="">
                All Sessions
              </option>

              <option value="FN">
                FN
              </option>

              <option value="AN">
                AN
              </option>

            </select>

          </div>

          {/* STATUS */}

          <div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500"
            >

              <option value="">
                All Status
              </option>

              <option value="scheduled">
                Scheduled
              </option>

              <option value="ongoing">
                Ongoing
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

            </select>

          </div>

        </div>

      </div>

      {/* =====================================================
          EXAMS CARD
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              All Exams
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredExams.length} exam
              {filteredExams.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>

          </div>

          {selectedCount > 0 && (
            <div className="flex items-center gap-3">

              <span className="text-sm font-medium text-slate-500">
                {selectedCount} selected
              </span>

              <button
                type="button"
                onClick={deleteSelected}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Selected
              </button>

            </div>
          )}

        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading exams...
              </p>

            </div>

          </div>

        ) : filteredExams.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================== */

          <div className="p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              📝
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No exams found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add an exam or change your search filters.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Exam
            </button>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================== */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px] text-left">

              <thead className="bg-slate-50">

                <tr>

                  <th className="w-12 px-5 py-4">

                    <input
                      type="checkbox"
                      checked={
                        allCurrentPageSelected
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />

                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Exam
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Session
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {paginatedExams.map(
                  (exam, index) => {

                    const isSelected =
                      selectedIds.includes(
                        exam.id
                      );

                    return (
                      <tr
                        key={exam.id}
                        className={`border-t border-slate-100 transition hover:bg-slate-50 ${
                          isSelected
                            ? "bg-blue-50/50"
                            : ""
                        }`}
                      >

                        <td className="px-5 py-4">

                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleSelect(
                                exam.id
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {startIndex +
                            index +
                            1}
                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-800">
                            {exam.exam_name}
                          </p>

                          {exam.academic_year && (
                            <p className="mt-1 text-xs text-slate-400">
                              Academic Year:{" "}
                              {
                                exam.academic_year
                              }
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-700">
                            {
                              exam.subject_name
                            }
                          </p>

                          {exam.subject_code && (
                            <p className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                              {
                                exam.subject_code
                              }
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {formatDate(
                            exam.exam_date
                          )}
                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                            {exam.session}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-sm text-slate-600">
                            {exam.start_time
                              ? String(
                                  exam.start_time
                                ).substring(
                                  0,
                                  5
                                )
                              : "—"}

                            {" - "}

                            {exam.end_time
                              ? String(
                                  exam.end_time
                                ).substring(
                                  0,
                                  5
                                )
                              : "—"}
                          </p>

                          {exam.duration_minutes && (
                            <p className="mt-1 text-xs text-slate-400">
                              {
                                exam.duration_minutes
                              }{" "}
                              minutes
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                              exam.status
                            )}`}
                          >
                            {
                              exam.status
                            }
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* ===================================================
            PAGINATION
        ==================================================== */}

        {!loading &&
          filteredExams.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    startIndex +
                      paginatedExams.length,
                    filteredExams.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredExams.length}
                </span>
              </p>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={
                    safeCurrentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {safeCurrentPage} /{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>

              </div>

            </div>
          )}

      </div>

      {/* =====================================================
          BOTTOM ACTION BAR
      ====================================================== */}

      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-2xl">

          <span className="text-sm font-medium">
            {selectedCount} exam
            {selectedCount > 1
              ? "s"
              : ""}{" "}
            selected
          </span>

          {selectedCount === 1 && (
            <button
              type="button"
              onClick={() => {
                const exam = exams.find(
                  (item) =>
                    item.id === selectedIds[0]
                );

                if (exam) {
                  openEditModal(exam);
                }
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
            >
              Edit
            </button>
          )}

          <button
            type="button"
            onClick={deleteSelected}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedIds([])
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-600"
          >
            Cancel
          </button>

        </div>
      )}

      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingExam
                    ? "Edit Exam"
                    : "Add Exam"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter examination and schedule details.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              {success && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  ✓ {success}
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EXAM NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Exam Name
                  </label>

                  <input
                    type="text"
                    value={examName}
                    onChange={(e) =>
                      setExamName(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Internal Assessment - I"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* SUBJECT */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Subject Code
                      <span className="ml-1 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={subjectCode}
                      onChange={(e) =>
                        setSubjectCode(
                          e.target.value
                        )
                      }
                      placeholder="e.g. 23CS101"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm uppercase outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Subject Name
                    </label>

                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) =>
                        setSubjectName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Data Structures"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                </div>

                {/* DATE + SESSION */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Exam Date
                    </label>

                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) =>
                        setExamDate(
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Session
                    </label>

                    <select
                      value={session}
                      onChange={(e) =>
                        setSession(
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >

                      <option value="">
                        Select session
                      </option>

                      <option value="FN">
                        FN - Forenoon
                      </option>

                      <option value="AN">
                        AN - Afternoon
                      </option>

                    </select>

                  </div>

                </div>

                {/* TIME */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Start Time
                    </label>

                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) =>
                        setStartTime(
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      End Time
                    </label>

                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) =>
                        setEndTime(
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Duration
                      <span className="ml-1 font-normal text-slate-400">
                        (Minutes)
                      </span>
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={durationMinutes}
                      onChange={(e) =>
                        setDurationMinutes(
                          e.target.value
                        )
                      }
                      placeholder="180"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                </div>

                {/* ACADEMIC YEAR + SEMESTER */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Academic Year
                    </label>

                    <input
                      type="text"
                      value={academicYear}
                      onChange={(e) =>
                        setAcademicYear(
                          e.target.value
                        )
                      }
                      placeholder="e.g. 2026-27"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Semester
                    </label>

                    <input
                      type="text"
                      value={semester}
                      onChange={(e) =>
                        setSemester(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Semester 1"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                </div>

                {/* STATUS */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >

                    <option value="scheduled">
                      Scheduled
                    </option>

                    <option value="ongoing">
                      Ongoing
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                  </select>

                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingExam
                      ? "Update Exam"
                      : "Save Exam"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Exams;
