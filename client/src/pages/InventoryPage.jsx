import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { LuRefreshCcw } from "react-icons/lu";
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
  const [refillTarget, setRefillTarget] = useState(null);
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

  const handleRefillSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createMaterial(payload);
      toast.success("Refill request submitted for approval");
      setRefillTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit refill request");
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
                <button
                  onClick={() => setRefillTarget(row)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-graphite-900/15 text-xs font-medium text-graphite-700 hover:border-amber hover:text-amber-dark ml-auto"
                >
                  <LuRefreshCcw size={13} /> Refill
                </button>
              )
            : undefined
        }
      />

      {refillTarget && (
        <MaterialFormModal
          mode="refill"
          initialData={refillTarget}
          onClose={() => setRefillTarget(null)}
          onSubmit={handleRefillSubmit}
          submitting={submitting}
        />
      )}
    </DashboardLayout>
  );
};

export default InventoryPage;
