import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { LuRefreshCcw, LuMinus } from "react-icons/lu";
import DashboardLayout from "../layouts/DashboardLayout";
import MaterialTable from "../components/MaterialTable";
import MaterialFormModal from "../components/MaterialFormModal";
import { useAuth } from "../context/AuthContext";
import { getInventory, createMaterial } from "../services/materialService";

const InventoryPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { mode: "refill" | "reduce", row }
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getInventory({ search, category, page, limit: 8, sortBy: "name" })
      .then(setData)
      .finally(() => setLoading(false));
  }, [search, category, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActionSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createMaterial(payload);
      toast.success(
        actionModal.mode === "reduce"
          ? "Reduction request submitted for approval"
          : "Refill request submitted for approval"
      );
      setActionModal(null);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to submit ${actionModal.mode === "reduce" ? "reduction" : "refill"} request`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Material Name" },
    { key: "category", label: "Category" },
    {
      key: "quantity",
      label: "Quantity in stock",
      render: (row) => (
        <span className="font-mono">
          {row.quantity} {row.unitType}
        </span>
      ),
    },
    {
      key: "createdBy",
      label: "Added By",
      render: (row) => row.createdBy?.name || "—",
    },
  ];

  return (
    <DashboardLayout
      title="Inventory"
      subtitle="Approved raw materials currently in stock across all categories."
    >
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
        showStatus={false}
        emptyMessage={loading ? "Loading..." : "No approved materials found."}
        renderActions={
          user?.role === "storekeeper"
            ? (row) => (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActionModal({ mode: "refill", row })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-graphite-900/15 text-xs font-medium text-graphite-700 hover:border-amber hover:text-amber-dark"
                  >
                    <LuRefreshCcw size={13} /> Refill
                  </button>
                  <button
                    onClick={() => setActionModal({ mode: "reduce", row })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-graphite-900/15 text-xs font-medium text-graphite-700 hover:border-rejected hover:text-rejected"
                  >
                    <LuMinus size={13} /> Reduce
                  </button>
                </div>
              )
            : undefined
        }
      />

      {actionModal && (
        <MaterialFormModal
          mode={actionModal.mode}
          initialData={actionModal.row}
          onClose={() => setActionModal(null)}
          onSubmit={handleActionSubmit}
          submitting={submitting}
        />
      )}
    </DashboardLayout>
  );
};

export default InventoryPage;
