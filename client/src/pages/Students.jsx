import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

const API_URL = "http://localhost:5000/api/students";
const DEPARTMENT_API_URL = "http://localhost:5000/api/departments";

const STUDENTS_PER_PAGE = 10;

function Students() {
  // =========================================================
  // DATA
  // =========================================================

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);

  // =========================================================
  // PAGE / FILTER STATE
  // =========================================================

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // LOADING / MESSAGES
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [excelUploading, setExcelUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // MODALS
  // =========================================================

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);

  // =========================================================
  // SELECTED STUDENTS
  // =========================================================

  const [selectedStudents, setSelectedStudents] = useState([]);

  // =========================================================
  // FORM
  // =========================================================

  const [registerNumber, setRegisterNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const fileInputRef = useRef(null);

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch students"
        );
      }

      setStudents(result.data || []);
    } catch (err) {
      console.error("Fetch students error:", err);

      setError(
        "Unable to load students. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH DEPARTMENTS
  // =========================================================

  const fetchDepartments = async () => {
    try {
      const response = await fetch(DEPARTMENT_API_URL);
      const result = await response.json();

      if (response.ok && result.success) {
        setDepartments(result.data || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, []);

  // =========================================================
  // FILTER STUDENTS
  // =========================================================

  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !searchValue ||
        String(student.register_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.roll_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.full_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.department_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(student.department_code || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesDepartment =
        !departmentFilter ||
        String(student.department_id) ===
          String(departmentFilter);

      const matchesYear =
        !yearFilter ||
        String(student.year) === String(yearFilter);

      const matchesSection =
        !sectionFilter ||
        String(student.section || "").toLowerCase() ===
          sectionFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesYear &&
        matchesSection
      );
    });
  }, [
    students,
    search,
    departmentFilter,
    yearFilter,
    sectionFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length / STUDENTS_PER_PAGE
    )
  );

  const paginatedStudents = useMemo(() => {
    const start =
      (currentPage - 1) * STUDENTS_PER_PAGE;

    return filteredStudents.slice(
      start,
      start + STUDENTS_PER_PAGE
    );
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    departmentFilter,
    yearFilter,
    sectionFilter,
  ]);

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    setEditingStudent(null);

    setRegisterNumber("");
    setRollNumber("");
    setFullName("");
    setDepartmentId("");
    setYear("");
    setSection("");
    setEmail("");
    setPhone("");

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = (student) => {
    if (!student) return;

    setEditingStudent(student);

    setRegisterNumber(
      student.register_number || ""
    );

    setRollNumber(
      student.roll_number || ""
    );

    setFullName(
      student.full_name || ""
    );

    setDepartmentId(
      student.department_id
        ? String(student.department_id)
        : ""
    );

    setYear(
      student.year
        ? String(student.year)
        : ""
    );

    setSection(
      student.section || ""
    );

    setEmail(
      student.email || ""
    );

    setPhone(
      student.phone || ""
    );

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (saving || excelUploading) return;

    setShowModal(false);
    setEditingStudent(null);

    setError("");
    setSuccess("");
  };

  // =========================================================
  // FORM SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const data = {
      register_number: registerNumber.trim(),
      roll_number:
        rollNumber.trim() || null,
      full_name: fullName.trim(),
      department_id: departmentId,
      year: Number(year),
      section:
        section.trim() || null,
      email:
        email.trim() || null,
      phone:
        phone.trim() || null,
    };

    if (!data.register_number) {
      setError("Register number is required.");
      return;
    }

    if (!data.full_name) {
      setError("Full name is required.");
      return;
    }

    if (!data.department_id) {
      setError("Please select a department.");
      return;
    }

    if (!data.year) {
      setError("Please select a year.");
      return;
    }

    try {
      setSaving(true);

      let response;

      if (editingStudent) {
        // =====================================================
        // UPDATE
        // =====================================================

        response = await fetch(
          `${API_URL}/${editingStudent.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );
      } else {
        // =====================================================
        // CREATE
        // =====================================================

        response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            (editingStudent
              ? "Failed to update student."
              : "Failed to create student.")
        );
      }

      setSuccess(
        editingStudent
          ? "Student updated successfully."
          : "Student added successfully."
      );

      await fetchStudents();

      if (!editingStudent) {
        setRegisterNumber("");
        setRollNumber("");
        setFullName("");
        setDepartmentId("");
        setYear("");
        setSection("");
        setEmail("");
        setPhone("");
      }

      if (editingStudent) {
        setTimeout(() => {
          setShowModal(false);
          setEditingStudent(null);
          setSuccess("");
        }, 700);
      }
    } catch (err) {
      console.error("Save student error:", err);

      setError(
        err.message ||
          "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // SELECT SINGLE STUDENT
  // =========================================================

  const toggleStudentSelection = (id) => {
    setSelectedStudents((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (studentId) => studentId !== id
        );
      }

      return [...previous, id];
    });
  };

  // =========================================================
  // SELECT ALL CURRENT PAGE
  // =========================================================

  const allCurrentPageSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((student) =>
      selectedStudents.includes(student.id)
    );

  const toggleSelectAll = () => {
    const currentPageIds =
      paginatedStudents.map(
        (student) => student.id
      );

    if (allCurrentPageSelected) {
      setSelectedStudents((previous) =>
        previous.filter(
          (id) => !currentPageIds.includes(id)
        )
      );
    } else {
      setSelectedStudents((previous) => [
        ...new Set([
          ...previous,
          ...currentPageIds,
        ]),
      ]);
    }
  };

  // =========================================================
  // CLEAR SELECTION
  // =========================================================

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  // =========================================================
  // OPEN DELETE CONFIRMATION
  // =========================================================

  const openDeleteModal = () => {
    if (selectedStudents.length === 0) return;

    setShowDeleteModal(true);
  };

  // =========================================================
  // DELETE SELECTED STUDENTS
  // =========================================================

  const confirmDelete = async () => {
    if (selectedStudents.length === 0) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      const deleteRequests =
        selectedStudents.map((id) =>
          fetch(`${API_URL}/${id}`, {
            method: "DELETE",
          })
        );

      const responses =
        await Promise.all(deleteRequests);

      const results =
        await Promise.all(
          responses.map((response) =>
            response.json()
          )
        );

      const failed = results.find(
        (result) => !result.success
      );

      if (failed) {
        throw new Error(
          failed.message ||
            "Failed to delete one or more students."
        );
      }

      const count =
        selectedStudents.length;

      setSelectedStudents([]);
      setShowDeleteModal(false);

      setSuccess(
        `${count} student${
          count > 1 ? "s" : ""
        } deleted successfully.`
      );

      await fetchStudents();
    } catch (err) {
      console.error(
        "Delete students error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete students."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // DOWNLOAD EXCEL TEMPLATE
  // =========================================================

  const downloadTemplate = () => {
    const templateData = [
      {
        register_number: "24BCA001",
        roll_number: "01",
        full_name: "Mouliwaran R",
        department_code: "BCA",
        year: 1,
        section: "A",
        email: "student@example.com",
        phone: "9876543210",
      },
      {
        register_number: "24BCA002",
        roll_number: "02",
        full_name: "Example Student",
        department_code: "BCA",
        year: 1,
        section: "A",
        email: "",
        phone: "",
      },
      {
        register_number: "24BCA003",
        roll_number: "03",
        full_name: "Another Student",
        department_code: "BCA",
        year: 1,
        section: "A",
        email: "",
        phone: "",
      },
    ];

    const worksheet =
      XLSX.utils.json_to_sheet(
        templateData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Students"
    );

    XLSX.writeFile(
      workbook,
      "student_upload_template.xlsx"
    );
  };

  // =========================================================
  // EXCEL UPLOAD
  // =========================================================

  const handleExcelUpload = async (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");
    setExcelUploading(true);

    try {
      const fileName =
        file.name.toLowerCase();

      if (
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls")
      ) {
        throw new Error(
          "Please upload an Excel file (.xlsx or .xls)."
        );
      }

      const arrayBuffer =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(arrayBuffer, {
          type: "array",
        });

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error(
          "The Excel file does not contain a sheet."
        );
      }

      const worksheet =
        workbook.Sheets[sheetName];

      const rows =
        XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
          }
        );

      if (!rows.length) {
        throw new Error(
          "The Excel file is empty."
        );
      }

      const formattedStudents =
        rows.map((row, index) => {
          const registerNumber =
            String(
              row.register_number || ""
            ).trim();

          const rollNumber =
            String(
              row.roll_number || ""
            ).trim();

          const fullName =
            String(
              row.full_name || ""
            ).trim();

          const departmentCode =
            String(
              row.department_code || ""
            )
              .trim()
              .toUpperCase();

          const year =
            Number(row.year);

          const section =
            String(
              row.section || ""
            ).trim();

          const email =
            String(
              row.email || ""
            ).trim();

          const phone =
            String(
              row.phone || ""
            ).trim();

          if (!registerNumber) {
            throw new Error(
              `Row ${
                index + 2
              }: Register number is required.`
            );
          }

          if (!fullName) {
            throw new Error(
              `Row ${
                index + 2
              }: Full name is required.`
            );
          }

          if (!departmentCode) {
            throw new Error(
              `Row ${
                index + 2
              }: Department code is required.`
            );
          }

          if (
            ![1, 2, 3, 4].includes(
              year
            )
          ) {
            throw new Error(
              `Row ${
                index + 2
              }: Year must be 1, 2, 3, or 4.`
            );
          }

          const department =
            departments.find(
              (item) =>
                String(
                  item.code
                ).toUpperCase() ===
                departmentCode
            );

          if (!department) {
            throw new Error(
              `Row ${
                index + 2
              }: Department code "${departmentCode}" does not exist.`
            );
          }

          return {
            register_number:
              registerNumber,

            roll_number:
              rollNumber || null,

            full_name:
              fullName,

            department_id:
              department.id,

            year,

            section:
              section || null,

            email:
              email || null,

            phone:
              phone || null,
          };
        });

      const response =
        await fetch(
          `${API_URL}/bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              students:
                formattedStudents,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to upload students."
        );
      }

      const inserted =
        result.summary?.inserted ??
        formattedStudents.length;

      const skipped =
        result.summary?.skipped ?? 0;

      setSuccess(
        `${inserted} student${
          inserted !== 1 ? "s" : ""
        } uploaded successfully${
          skipped
            ? `, ${skipped} skipped.`
            : "."
        }`
      );

      await fetchStudents();

      setSelectedStudents([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(
        "Excel upload error:",
        err
      );

      setError(
        err.message ||
          "Failed to upload Excel file."
      );
    } finally {
      setExcelUploading(false);
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setYearFilter("");
    setSectionFilter("");
    setCurrentPage(1);
  };

  // =========================================================
  // PAGINATION NUMBERS
  // =========================================================

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (
      currentPage <
      totalPages - 2
    ) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="w-full">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Students
          </h1>

          <p className="mt-2 text-slate-500">
            Manage students and their academic details.
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

          Add Student
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && !showModal && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4">

          <div>
            <p className="font-semibold text-red-700">
              Student problem
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchStudents}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && !showModal && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ {success}
        </div>
      )}

      {/* =====================================================
          STUDENTS CARD
      ====================================================== */}

      <div className="w-full overflow-hidden rounded-2xl bg-white shadow-sm">

        {/* ===================================================
            CARD HEADER
        ==================================================== */}

        <div className="border-b border-slate-200 p-6">

          <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  All Students
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredStudents.length} student
                  {filteredStudents.length !== 1
                    ? "s"
                    : ""}{" "}
                  found
                </p>
              </div>

              {selectedStudents.length > 0 && (
                <div className="flex items-center gap-2">

                  <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                    {selectedStudents.length} selected
                  </span>

                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={openDeleteModal}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    🗑 Delete
                  </button>

                  {/* EDIT ONLY WHEN ONE STUDENT SELECTED */}

                  {selectedStudents.length === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const student =
                          students.find(
                            (item) =>
                              item.id ===
                              selectedStudents[0]
                          );

                        if (student) {
                          openEditModal(
                            student
                          );
                        }
                      }}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      ✏ Edit
                    </button>
                  )}

                </div>
              )}

            </div>

            {/* =================================================
                SEARCH
            ================================================== */}

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by register number, name, roll number or department..."
                className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

            </div>

            {/* =================================================
                FILTERS
            ================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <select
                value={departmentFilter}
                onChange={(e) =>
                  setDepartmentFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  All Departments
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name} (
                      {department.code})
                    </option>
                  )
                )}

              </select>

              <select
                value={yearFilter}
                onChange={(e) =>
                  setYearFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  All Years
                </option>

                <option value="1">
                  1st Year
                </option>

                <option value="2">
                  2nd Year
                </option>

                <option value="3">
                  3rd Year
                </option>

                <option value="4">
                  4th Year
                </option>

              </select>

              <select
                value={sectionFilter}
                onChange={(e) =>
                  setSectionFilter(
                    e.target.value
                  )
                }
                className="h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >

                <option value="">
                  All Sections
                </option>

                {[
                  ...new Set(
                    students
                      .map(
                        (student) =>
                          student.section
                      )
                      .filter(Boolean)
                  ),
                ]
                  .sort()
                  .map(
                    (sectionName) => (
                      <option
                        key={sectionName}
                        value={sectionName}
                      >
                        Section{" "}
                        {sectionName}
                      </option>
                    )
                  )}

              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>

            </div>

          </div>

        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading students...
              </p>

            </div>

          </div>

        ) : filteredStudents.length === 0 ? (

          /* =================================================
             NO STUDENTS
          ================================================== */

          <div className="p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              🎓
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No students found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================== */

          <>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px] text-left">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="w-12 px-4 py-4">

                      <input
                        type="checkbox"
                        checked={
                          allCurrentPageSelected
                        }
                        onChange={
                          toggleSelectAll
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Register No.
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Name
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Department
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Year
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Section
                    </th>

                    <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedStudents.map(
                    (student, index) => {

                      const isSelected =
                        selectedStudents.includes(
                          student.id
                        );

                      const globalIndex =
                        (currentPage - 1) *
                          STUDENTS_PER_PAGE +
                        index;

                      return (
                        <tr
                          key={student.id}
                          className={`border-t border-slate-100 transition ${
                            isSelected
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >

                          {/* CHECKBOX */}

                          <td className="px-4 py-4">

                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                toggleStudentSelection(
                                  student.id
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />

                          </td>

                          {/* NUMBER */}

                          <td className="px-4 py-4 text-sm text-slate-500">
                            {globalIndex + 1}
                          </td>

                          {/* REGISTER */}

                          <td className="px-4 py-4">

                            <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {
                                student.register_number
                              }
                            </span>

                          </td>

                          {/* NAME */}

                          <td className="px-4 py-4">

                            <div>

                              <p className="font-semibold text-slate-800">
                                {
                                  student.full_name
                                }
                              </p>

                              {student.roll_number && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Roll:{" "}
                                  {
                                    student.roll_number
                                  }
                                </p>
                              )}

                            </div>

                          </td>

                          {/* DEPARTMENT */}

                          <td className="px-4 py-4">

                            <p className="text-sm font-medium text-slate-700">
                              {
                                student.department_name ||
                                "—"
                              }
                            </p>

                            {student.department_code && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  student.department_code
                                }
                              </p>
                            )}

                          </td>

                          {/* YEAR */}

                          <td className="px-4 py-4 text-sm text-slate-600">
                            Year{" "}
                            {student.year}
                          </td>

                          {/* SECTION */}

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {student.section ||
                              "—"}
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">

                            <span
                              className={
                                student.is_active
                                  ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600"
                                  : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                              }
                            >
                              {student.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            {/* =================================================
                PAGINATION
            ================================================== */}

            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

              <p className="text-sm text-slate-500">

                Showing{" "}

                <span className="font-semibold text-slate-700">
                  {
                    filteredStudents.length ===
                    0
                      ? 0
                      : (currentPage - 1) *
                          STUDENTS_PER_PAGE +
                        1
                  }
                </span>

                {" "}to{" "}

                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage *
                      STUDENTS_PER_PAGE,
                    filteredStudents.length
                  )}
                </span>

                {" "}of{" "}

                <span className="font-semibold text-slate-700">
                  {
                    filteredStudents.length
                  }
                </span>

                {" "}students

              </p>

              <div className="flex items-center gap-1">

                <button
                  type="button"
                  disabled={
                    currentPage === 1
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ←
                </button>

                {getPageNumbers().map(
                  (page, index) =>
                    page === "..." ? (
                      <span
                        key={`dots-${index}`}
                        className="px-2 text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          currentPage ===
                          page
                            ? "bg-blue-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                )}

                <button
                  type="button"
                  disabled={
                    currentPage ===
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  →
                </button>

              </div>

            </div>

          </>

        )}

      </div>

      {/* =====================================================
          ADD / EDIT STUDENT MODAL
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

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingStudent
                    ? "Edit Student"
                    : "Add Student"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingStudent
                    ? "Update the student's academic details."
                    : "Add one student manually or upload multiple students using Excel."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  excelUploading
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              {/* =================================================
                  EXCEL SECTION
              ================================================== */}

              {!editingStudent && (
                <div className="mb-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-5">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-2xl">
                          📊
                        </div>

                        <div>

                          <h3 className="font-bold text-slate-800">
                            Upload Excel
                          </h3>

                          <p className="text-sm text-slate-500">
                            Add multiple students at once
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={
                          downloadTemplate
                        }
                        disabled={
                          excelUploading
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Download Template
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={
                          excelUploading
                        }
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {excelUploading
                          ? "Uploading..."
                          : "Choose Excel File"}
                      </button>

                      <input
                        ref={
                          fileInputRef
                        }
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={
                          handleExcelUpload
                        }
                        className="hidden"
                      />

                    </div>

                  </div>

                  <div className="mt-4 rounded-xl bg-white/70 p-3 text-xs text-slate-500">

                    <p className="font-semibold text-slate-700">
                      Excel columns:
                    </p>

                    <p className="mt-1">
                      register_number, roll_number,
                      full_name, department_code,
                      year, section, email, phone
                    </p>

                    <p className="mt-2">
                      Department code must match a department
                      already registered in the system, such as BCA.
                    </p>

                  </div>

                </div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================== */}

              {success && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  ✓ {success}
                </div>
              )}

              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* =================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5"
              >

                {/* REGISTER */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Register Number
                  </label>

                  <input
                    type="text"
                    value={
                      registerNumber
                    }
                    onChange={(e) =>
                      setRegisterNumber(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 24BCA001"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* ROLL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Roll Number
                    <span className="ml-1 font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      rollNumber
                    }
                    onChange={(e) =>
                      setRollNumber(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 01"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={
                      fullName
                    }
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    placeholder="Enter student's full name"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* DEPARTMENT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Department
                  </label>

                  <select
                    value={
                      departmentId
                    }
                    onChange={(e) =>
                      setDepartmentId(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >

                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }{" "}
                          (
                          {
                            department.code
                          }
                          )
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* YEAR + SECTION */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Year
                    </label>

                    <select
                      value={year}
                      onChange={(e) =>
                        setYear(
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >

                      <option value="">
                        Select year
                      </option>

                      <option value="1">
                        1st Year
                      </option>

                      <option value="2">
                        2nd Year
                      </option>

                      <option value="3">
                        3rd Year
                      </option>

                      <option value="4">
                        4th Year
                      </option>

                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Section
                      <span className="ml-1 font-normal text-slate-400">
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        section
                      }
                      onChange={(e) =>
                        setSection(
                          e.target.value
                        )
                      }
                      placeholder="e.g. A"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />

                  </div>

                </div>

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                    <span className="ml-1 font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="student@example.com"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* PHONE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone
                    <span className="ml-1 font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    placeholder="Enter phone number"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving ||
                      excelUploading
                    }
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      excelUploading
                    }
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? editingStudent
                        ? "Updating..."
                        : "Saving..."
                      : editingStudent
                      ? "Update Student"
                      : "Save Student"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteModal && (

        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4"
        >

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
              🗑
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Delete{" "}
              {selectedStudents.length ===
              1
                ? "student"
                : "students"}
              ?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-700">
                {
                  selectedStudents.length
                }{" "}
                student
                {selectedStudents.length !==
                1
                  ? "s"
                  : ""}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setShowDeleteModal(
                    false
                  )
                }
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={
                  confirmDelete
                }
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting
                  ? "Deleting..."
                  : `Delete ${
                      selectedStudents.length
                    }`}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Students;