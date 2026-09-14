import { useEffect, useState } from "react";

const API_URL = "https://exam-hall-allotment-api.onrender.com/api/halls";

const emptyForm = {
  hall_number: "",
  building: "",
  floor: "",
  is_active: 1,
};

function Halls() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // FETCH HALLS
  // ============================================================

  const fetchHalls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch halls");
      }

      setHalls(result.data || []);
    } catch (err) {
      console.error("Fetch halls error:", err);
      setError(err.message || "Failed to fetch halls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  // ============================================================
  // OPEN ADD MODAL
  // ============================================================

  const openAddModal = () => {
    setEditingHall(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  const openEditModal = (hall) => {
    setEditingHall(hall);

    setForm({
      hall_number: hall.hall_number || "",
      building: hall.building || "",
      floor: hall.floor || "",
      is_active: Number(hall.is_active) === 1 ? 1 : 0,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingHall(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  // ============================================================
  // SAVE HALL
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const hallNumber = form.hall_number.trim();

      if (!hallNumber) {
        throw new Error("Hall number is required");
      }

      /*
        Capacity, rows and columns are no longer used by the UI.

        hall_name is still sent automatically because the existing
        backend/database may require it.

        hall_number = H-101
        hall_name   = H-101
      */

      const payload = {
        hall_name: hallNumber,
        hall_number: hallNumber,
        building: form.building.trim(),
        floor: form.floor.trim(),
        is_active: Number(form.is_active),
      };

      const url = editingHall
        ? `${API_URL}/${editingHall.id}`
        : API_URL;

      const method = editingHall ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save hall");
      }

      setSuccess(
        editingHall
          ? "Examination hall updated successfully"
          : "Examination hall created successfully"
      );

      await fetchHalls();

      setTimeout(() => {
        setShowModal(false);
        setEditingHall(null);
        setForm(emptyForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Save hall error:", err);
      setError(err.message || "Failed to save hall");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE HALL
  // ============================================================

  const handleDelete = async (hall) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Hall ${hall.hall_number}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${hall.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete hall");
      }

      setSuccess("Examination hall deleted successfully");

      await fetchHalls();

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Delete hall error:", err);
      setError(err.message || "Failed to delete hall");
    }
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalHalls = halls.length;

  const activeHalls = halls.filter(
    (hall) => Number(hall.is_active) === 1
  ).length;

  const inactiveHalls = halls.filter(
    (hall) => Number(hall.is_active) === 0
  ).length;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="w-full">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Examination Halls
          </h1>

          <p className="mt-2 text-slate-500">
            Manage examination halls and their locations.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Examination Hall
        </button>

      </div>

      {/* ========================================================
          SUCCESS MESSAGE
      ======================================================== */}

      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* ========================================================
          ERROR MESSAGE
      ======================================================== */}

      {error && !showModal && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ========================================================
          STATISTICS
      ======================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">

        <StatCard
          title="Total Halls"
          value={totalHalls}
          description="All examination halls"
          icon="🏫"
        />

        <StatCard
          title="Active Halls"
          value={activeHalls}
          description="Currently available"
          icon="✓"
        />

        <StatCard
          title="Inactive Halls"
          value={inactiveHalls}
          description="Currently unavailable"
          icon="⊘"
        />

      </div>

      {/* ========================================================
          HALL TABLE
      ======================================================== */}

      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Examination Halls
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage registered examination halls.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHalls}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ↻ Refresh
          </button>

        </div>

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading ? (

          <div className="flex min-h-[250px] items-center justify-center">
            <div className="text-sm font-medium text-slate-500">
              Loading examination halls...
            </div>
          </div>

        ) : halls.length === 0 ? (

          /* ====================================================
             EMPTY
          ==================================================== */

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              🏫
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              No examination halls
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              You haven't added any examination halls yet.
              Add your first hall to start managing examination halls.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add First Hall
            </button>

          </div>

        ) : (

          /* ====================================================
             TABLE
          ==================================================== */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-6 py-4">
                    Hall Number
                  </th>

                  <th className="px-6 py-4">
                    Building
                  </th>

                  <th className="px-6 py-4">
                    Floor
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {halls.map((hall) => (

                  <HallRow
                    key={hall.id}
                    hall={hall}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ========================================================
          ADD / EDIT MODAL
      ======================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingHall
                    ? "Edit Examination Hall"
                    : "Add Examination Hall"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the examination hall details below.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>

            </div>

            {/* MODAL ERROR */}

            {error && (
              <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >

              {/* HALL NUMBER */}

              <InputField
                label="Hall Number"
                name="hall_number"
                value={form.hall_number}
                onChange={handleChange}
                placeholder="Example: H-101"
                required
              />

              {/* BUILDING + FLOOR */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <InputField
                  label="Building"
                  name="building"
                  value={form.building}
                  onChange={handleChange}
                  placeholder="Example: Main Block"
                />

                <InputField
                  label="Floor"
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  placeholder="Example: Ground Floor"
                />

              </div>

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">

                <input
                  type="checkbox"
                  name="is_active"
                  checked={Number(form.is_active) === 1}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-800">
                    Active Hall
                  </p>

                  <p className="text-xs text-slate-500">
                    This hall can be used for examination allotment.
                  </p>

                </div>

              </label>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingHall
                    ? "Update Hall"
                    : "Create Hall"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

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

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// INPUT FIELD
// ============================================================

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />

    </div>
  );
}


// ============================================================
// HALL ROW
// ============================================================

function HallRow({
  hall,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="transition hover:bg-slate-50">

      {/* HALL NUMBER */}

      <td className="px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg">
            🏫
          </div>

          <div>

            <p className="font-semibold text-slate-800">
              {hall.hall_number}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Examination Hall
            </p>

          </div>

        </div>

      </td>


      {/* BUILDING */}

      <td className="px-6 py-5">

        <p className="text-sm font-medium text-slate-700">
          {hall.building || "—"}
        </p>

      </td>


      {/* FLOOR */}

      <td className="px-6 py-5">

        <p className="text-sm font-medium text-slate-700">
          {hall.floor || "—"}
        </p>

      </td>


      {/* STATUS */}

      <td className="px-6 py-5">

        {Number(hall.is_active) === 1 ? (

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>

        ) : (

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            Inactive
          </span>

        )}

      </td>


      {/* ACTIONS */}

      <td className="px-6 py-5">

        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={() => onEdit(hall)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(hall)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
          >
            Delete
          </button>

        </div>

      </td>

    </tr>
  );
}


export default Halls;
