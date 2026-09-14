import { useEffect, useState } from "react";

const API_URL = "https://exam-hall-allotment-api.onrender.com/api/departments";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  // =========================================================
  // FETCH DEPARTMENTS
  // =========================================================
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setDepartments(result.data || []);
      } else {
        throw new Error(
          result.message || "Failed to fetch departments"
        );
      }
    } catch (err) {
      console.error("Fetch departments error:", err);

      setError(
        "Unable to connect to the server. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);


  // =========================================================
  // OPEN MODAL
  // =========================================================
  const openModal = () => {
    setError("");
    setName("");
    setCode("");
    setDescription("");
    setShowModal(true);
  };


  // =========================================================
  // CLOSE MODAL
  // =========================================================
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setError("");
  };


  // =========================================================
  // CREATE DEPARTMENT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Department name is required.");
      return;
    }

    if (!trimmedCode) {
      setError("Department code is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          code: trimmedCode,
          description: trimmedDescription || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to create department."
        );
      }

      setName("");
      setCode("");
      setDescription("");

      setShowModal(false);

      await fetchDepartments();
    } catch (err) {
      console.error("Create department error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };


  // =========================================================
  // DELETE DEPARTMENT
  // =========================================================
  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}" (${department.code})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(department.id);
      setError("");

      const response = await fetch(
        `${API_URL}/${department.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to delete department."
        );
      }

      // Remove immediately from UI
      setDepartments((currentDepartments) =>
        currentDepartments.filter(
          (item) => item.id !== department.id
        )
      );
    } catch (err) {
      console.error("Delete department error:", err);

      setError(
        err.message || "Failed to delete department."
      );
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="w-full">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Departments
          </h1>

          <p className="mt-2 text-slate-500">
            Manage college departments and their details.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="mr-2 text-lg">+</span>
          Add Department
        </button>

      </div>


      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}
      {error && !showModal && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4">

          <div>
            <p className="font-semibold text-red-700">
              Error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDepartments}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}


      {/* =====================================================
          DEPARTMENTS CARD
      ====================================================== */}
      <div className="w-full overflow-hidden rounded-2xl bg-white shadow-sm">

        <div className="border-b border-slate-200 p-6">

          <h2 className="text-lg font-bold text-slate-900">
            All Departments
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Departments currently registered in the system.
          </p>

        </div>


        {/* ===================================================
            LOADING
        ==================================================== */}
        {loading ? (

          <div className="flex min-h-[250px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading departments...
              </p>

            </div>

          </div>

        ) : departments.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================== */
          <div className="p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              🏫
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No departments yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add your first department to get started.
            </p>

            <button
              type="button"
              onClick={openModal}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Department
            </button>

          </div>

        ) : (

          /* =================================================
             DEPARTMENT TABLE
          ================================================== */
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Department
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Code
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {departments.map((department, index) => (

                  <tr
                    key={department.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {index + 1}
                    </td>


                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {department.name}
                    </td>


                    <td className="px-6 py-4">

                      <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {department.code}
                      </span>

                    </td>


                    <td className="px-6 py-4 text-sm text-slate-500">
                      {department.description || "—"}
                    </td>


                    <td className="px-6 py-4">

                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                        Active
                      </span>

                    </td>


                    {/* DELETE BUTTON */}
                    <td className="px-6 py-4 text-right">

                      <button
                        type="button"
                        onClick={() => handleDelete(department)}
                        disabled={deletingId === department.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === department.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          ADD DEPARTMENT MODAL
      ====================================================== */}
      {showModal && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Add Department
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the department information below.
                </p>

              </div>


              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                ×
              </button>

            </div>


            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* Error */}
              {error && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>

              )}


              {/* Department Name */}
              <div>

                <label
                  htmlFor="department-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Department Name
                </label>

                <input
                  id="department-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bachelor of Computer Applications"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

              </div>


              {/* Department Code */}
              <div>

                <label
                  htmlFor="department-code"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Department Code
                </label>

                <input
                  id="department-code"
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. BCA"
                  maxLength={20}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

              </div>


              {/* Description */}
              <div>

                <label
                  htmlFor="department-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description

                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>

                </label>

                <textarea
                  id="department-description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Enter a short description"
                  rows={3}
                  maxLength={255}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

              </div>


              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Department"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Departments;
