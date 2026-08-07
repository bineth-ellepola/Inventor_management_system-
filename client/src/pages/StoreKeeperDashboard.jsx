import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuBoxes, LuFlaskConical, LuPackage, LuTag, LuClock, LuCheck } from "react-icons/lu";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardCard from "../components/DashboardCard";
import { getStoreKeeperStats } from "../services/materialService";

const StoreKeeperDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStoreKeeperStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout
      title="Store Keeper Dashboard"
      subtitle="Track inventory levels and the status of your material requests."
    >
      {loading ? (
        <p className="text-graphite-600 text-sm">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <DashboardCard label="Total Materials" value={stats.totalMaterials} icon={LuBoxes} accent="slateblue" />
            <DashboardCard label="Chemicals" value={stats.totalChemicals} icon={LuFlaskConical} accent="amber" />
            <DashboardCard label="Packing Materials" value={stats.totalPacking} icon={LuPackage} accent="amber" />
            <DashboardCard label="Labels" value={stats.totalLabels} icon={LuTag} accent="amber" />
            <DashboardCard label="Pending Requests" value={stats.pendingRequests} icon={LuClock} accent="amber" />
            <DashboardCard label="Approved Requests" value={stats.approvedRequests} icon={LuCheck} accent="approved" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/storekeeper/requests")}
              className="px-5 py-3 rounded-md bg-graphite-900 text-white text-sm font-medium hover:bg-graphite-800"
            >
              Submit a new material request
            </button>
            <button
              onClick={() => navigate("/inventory")}
              className="px-5 py-3 rounded-md border border-graphite-900/15 text-graphite-800 text-sm font-medium hover:bg-paper-dim"
            >
              Browse full inventory
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default StoreKeeperDashboard;
