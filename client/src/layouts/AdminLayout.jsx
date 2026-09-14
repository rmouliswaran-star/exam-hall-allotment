import { useState } from "react";
import { NavLink } from "react-router-dom";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-300 hover:bg-slate-800"
    }`;

  const handleMenuClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          bg-slate-900 text-white
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >

        {/* LOGO */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-700 px-5">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
            AVS
          </div>

          <div>
            <h1 className="font-bold">
              Exam Allotment
            </h1>

            <p className="text-xs text-slate-400">
              Administration
            </p>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-2xl text-slate-400 lg:hidden"
          >
            ×
          </button>

        </div>


        {/* =====================================================
            MENU
        ====================================================== */}
        <nav className="p-4">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">

            {/* DASHBOARD */}
            <NavLink
              to="/admin"
              end
              className={menuClass}
              onClick={handleMenuClick}
            >
              <span className="text-lg">📊</span>
              <span>Dashboard</span>
            </NavLink>


            {/* STUDENTS */}
            <NavLink
              to="/admin/students"
              className={menuClass}
              onClick={handleMenuClick}
            >
              <span className="text-lg">👨‍🎓</span>
              <span>Students</span>
            </NavLink>


            {/* DEPARTMENTS */}
            <NavLink
              to="/admin/departments"
              className={menuClass}
              onClick={handleMenuClick}
            >
              <span className="text-lg">🏢</span>
              <span>Departments</span>
            </NavLink>


            {/* EXAMS */}
            <NavLink
              to="/admin/exams"
              className={menuClass}
              onClick={handleMenuClick}
            >
              <span className="text-lg">📝</span>
              <span>Exams</span>
            </NavLink>


            {/* EXAMINATION HALLS */}
            <NavLink
              to="/admin/halls"
              className={menuClass}
              onClick={handleMenuClick}
            >
              <span className="text-lg">🏫</span>
              <span>Examination Halls</span>
            </NavLink>


            {/* HALL ALLOTMENT */}
            <NavLink
              to="/admin/allotment"
              className={menuClass}
              onClick={handleMenuClick}
            >
              <span className="text-lg">🎯</span>
              <span>Hall Allotment</span>
            </NavLink>

          </div>


          {/* =================================================
              REPORTS
          ================================================== */}
          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reports
          </p>

          <NavLink
            to="/admin/reports"
            className={menuClass}
            onClick={handleMenuClick}
          >
            <span className="text-lg">📑</span>
            <span>Reports</span>
          </NavLink>

        </nav>


        {/* =====================================================
            LOGOUT
        ====================================================== */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-300 hover:bg-slate-800"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="lg:pl-64">

        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

          {/* LEFT */}
          <div className="flex items-center gap-4">

            {/* MOBILE MENU */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              ☰
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                Admin Dashboard
              </h2>

              <p className="hidden text-sm text-slate-500 sm:block">
                Examination management overview
              </p>
            </div>

          </div>


          {/* RIGHT - ADMIN PROFILE */}
          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-800">
                Administrator
              </p>

              <p className="text-xs text-slate-500">
                Exam Cell
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              A
            </div>

          </div>

        </header>


        {/* =====================================================
            PAGE CONTENT
        ====================================================== */}
        <main className="w-full overflow-x-hidden">

          <div className="w-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>

        </main>

      </div>

    </div>
  );
}

export default AdminLayout;