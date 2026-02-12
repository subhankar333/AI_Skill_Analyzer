import { Routes, Route, Navigate } from "react-router-dom";

import SelectEmployee from "./pages/SelectEmployee";
import Dashboard from "./pages/Dashboard";
import LearningPath from "./pages/LearningPath";
import Assessment from "./pages/Assessment";
import AssessmentResult from "./pages/AssessmentResult";
import CreateEmployee from "./pages/CreateEmployee";
import Profile from "./pages/Profile";
import Login from "./pages/login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmployeeDetail from "./pages/AdminEmployeeDetail";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminHome from "./pages/AdminHome";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

function App() {
  // Check localStorage to determine where to redirect root path
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const employeeId = localStorage.getItem("employeeId");

  let rootElement;
  if (!token) {
    // Not logged in - redirect to login
    rootElement = <Navigate to="/login" replace />;
  } else if (role === "EMPLOYEE" && employeeId) {
    // Employee logged in - redirect to home
    rootElement = <Navigate to="/home" replace />;
  } else if (role === "ADMIN") {
    // Admin logged in - redirect to admin dashboard
    rootElement = <Navigate to="/admin" replace />;
  } else {
    // Unknown state - redirect to login
    rootElement = <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={rootElement} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated routes with AppLayout (includes global header with logout) */}
      <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]}><AppLayout /></ProtectedRoute>}>
        {/* Employee Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/:employeeId"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learning-path/:employeeId"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <LearningPath />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assessment/:employeeId"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <Assessment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/:employeeId/result"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <AssessmentResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/:employeeId/profile"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/create-employee"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <CreateEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employee/:employeeId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminEmployeeDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
