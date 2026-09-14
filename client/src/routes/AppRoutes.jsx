import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Departments from "../pages/Departments";
import Students from "../pages/Students";
import Exams from "../pages/Exams";
import Halls from "../pages/Halls";
import ExamStudent from "../pages/ExamStudent";
import Allotment from "../pages/Allotment";

import AdminLayout from "../layouts/AdminLayout";

function AppRoutes() {
  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* DASHBOARD */}
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        }
      />

      {/* STUDENTS */}
      <Route
        path="/admin/students"
        element={
          <AdminLayout>
            <Students />
          </AdminLayout>
        }
      />

      {/* DEPARTMENTS */}
      <Route
        path="/admin/departments"
        element={
          <AdminLayout>
            <Departments />
          </AdminLayout>
        }
      />

      {/* EXAMS */}
      <Route
        path="/admin/exams"
        element={
          <AdminLayout>
            <Exams />
          </AdminLayout>
        }
      />

      {/* HALLS */}
      <Route
        path="/admin/halls"
        element={
          <AdminLayout>
            <Halls />
          </AdminLayout>
        }
      />

      {/* EXAM STUDENT SELECTION */}
      <Route
        path="/admin/exam-students"
        element={
          <AdminLayout>
            <ExamStudent />
          </AdminLayout>
        }
      />

      {/* HALL ALLOTMENT */}
      <Route
        path="/admin/allotment"
        element={
          <AdminLayout>
            <Allotment />
          </AdminLayout>
        }
      />

      {/* REPORTS */}
      <Route
        path="/admin/reports"
        element={
          <AdminLayout>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">
                Reports
              </h1>

              <p className="mt-2 text-slate-500">
                Reports module will be available soon.
              </p>
            </div>
          </AdminLayout>
        }
      />

      {/* UNKNOWN URL */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default AppRoutes;