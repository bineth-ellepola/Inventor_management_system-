import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuClock, LuCheckCheck, LuBoxes, LuX } from "react-icons/lu";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import { getManagerStats } from "../services/materialService";

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getManagerStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="Manager Dashboard"
      subtitle="Review incoming requests and keep the inventory ledger accurate."
    >
      {loading ? (
        <p className="text-graphite-600 text-sm">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <DashboardCard label="Pending Approvals" value={stats.pendingApprovals} icon={LuClock} accent="amber" />
            <DashboardCard label="Approved Today" value={stats.approvedToday} icon={LuCheckCheck} accent="approved" />
            <DashboardCard label="Total Inventory Items" value={stats.totalInventoryItems} icon={LuBoxes} accent="slateblue" />
            <DashboardCard label="Rejected Requests" value={stats.rejectedRequests} icon={LuX} accent="rejected" />
          </div>

          <button
            onClick={() => navigate("/manager/approvals")}
            className="px-5 py-3 rounded-md bg-graphite-900 text-white text-sm font-medium hover:bg-graphite-800"
          >
            Review pending requests
          </button>
        </>
      )}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
