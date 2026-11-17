import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import StoreKeeperDashboard from "./pages/StoreKeeperDashboard";
import StoreKeeperRequests from "./pages/StoreKeeperRequests";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerApprovals from "./pages/ManagerApprovals";
import InventoryPage from "./pages/InventoryPage";
import StockHistory from "./pages/StockHistory";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route
          path="/manager/stock-history"
          element={<ProtectedRoute allowedRoles={["manager"]}><StockHistory /></ProtectedRoute>}
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === "manager" ? "/manager" : "/storekeeper"} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/storekeeper"
          element={
            <ProtectedRoute allowedRoles={["storekeeper"]}>
              <StoreKeeperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/storekeeper/requests"
          element={
            <ProtectedRoute allowedRoles={["storekeeper"]}>
              <StoreKeeperRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/approvals"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <ManagerApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={["manager", "storekeeper"]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate to={user ? (user.role === "manager" ? "/manager" : "/storekeeper") : "/login"} replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </>
  );
}

export default App;
