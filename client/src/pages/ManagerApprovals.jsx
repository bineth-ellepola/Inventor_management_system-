import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { LuCheck, LuX } from "react-icons/lu";
import DashboardLayout from "../layouts/DashboardLayout";
import MaterialTable from "../components/MaterialTable";
import {
  getPendingRequests,
  getApprovalHistory,
  approveRequest,
  rejectRequest,
} from "../services/materialService";

const ManagerApprovals = () => {
  const [tab, setTab] = useState("pending"); // pending | history
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const fetcher = tab === "pending" ? getPendingRequests : getApprovalHistory;
    fetcher({ search, category, page, limit: 8 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [tab, search, category, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (row) => {
    setActingId(row._id);
    try {
      await approveRequest(row._id);
      toast.success(
        row.requestType === "reduce"
          ? `"${row.name}" approved and deducted from inventory`
          : `"${row.name}" approved and added to inventory`
      );
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (row) => {
    const reason = window.prompt(`Reason for rejecting "${row.name}" (optional):`) || "";
    setActingId(row._id);
    try {
      await rejectRequest(row._id, reason);
      toast.success(`"${row.name}" rejected`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActingId(null);
    }
  };

  const columns = [
    { key: "name", label: "Material Name" },
    { key: "category", label: "Category" },
    {
      key: "quantity",
      label: "Quantity",
      render: (row) => (
        <span className="font-mono">
          {row.quantity} {row.unitType}
        </span>
      ),
    },
    {
      key: "requestType",
      label: "Type",
      render: (row) =>
        row.requestType === "refill" ? "Refill" : row.requestType === "reduce" ? "Reduce" : "New",
    },
    {
      key: "createdBy",
      label: "Requested By",
      render: (row) => row.createdBy?.name || "—",
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <DashboardLayout
      title="Approvals"
      subtitle="Approve or reject material requests submitted by store keepers."
    >
      <div className="flex gap-2 mb-4">
        {["pending", "history"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md capitalize ${
              tab === t
                ? "bg-graphite-900 text-white"
                : "bg-white border border-graphite-900/15 text-graphite-700 hover:bg-paper-dim"
            }`}
          >
            {t === "pending" ? "Pending Requests" : "Approval History"}
          </button>
        ))}
      </div>

      <MaterialTable
        columns={columns}
        data={data}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(v) => {
          setCategory(v);
          setPage(1);
        }}
        onPageChange={setPage}
        showStatus={tab === "history"}
        emptyMessage={
          loading ? "Loading..." : tab === "pending" ? "No pending requests." : "No history yet."
        }
        renderActions={
          tab === "pending"
            ? (row) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleApprove(row)}
                    disabled={actingId === row._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-approved/30 text-approved text-xs font-medium hover:bg-approved/10 disabled:opacity-50"
                  >
                    <LuCheck size={13} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(row)}
                    disabled={actingId === row._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-rejected/30 text-rejected text-xs font-medium hover:bg-rejected/10 disabled:opacity-50"
                  >
                    <LuX size={13} /> Reject
                  </button>
                </div>
              )
            : undefined
        }
      />
    </DashboardLayout>
  );
};

export default ManagerApprovals;
