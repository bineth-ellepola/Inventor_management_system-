import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuPencil, LuTrash2 } from "react-icons/lu";
import DashboardLayout from "../layouts/DashboardLayout";
import MaterialTable from "../components/MaterialTable";
import MaterialFormModal from "../components/MaterialFormModal";
import {
  getMyRequests,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../services/materialService";

const StoreKeeperRequests = () => {
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode, initialData }
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    getMyRequests({ search, category, page, limit: 8 })
      .then(setData)
      .finally(() => setLoading(false));
  }, [search, category, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => setModal({ mode: "add", initialData: null });
  const handleEdit = (row) => setModal({ mode: "edit", initialData: row });

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete the pending request for "${row.name}"?`)) return;
    try {
      await deleteMaterial(row._id);
      toast.success("Request deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete request");
    }
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (modal.mode === "edit") {
        await updateMaterial(modal.initialData._id, payload);
        toast.success("Request updated");
      } else {
        await createMaterial(payload);
        toast.success("Request submitted for approval");
      }
      setModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
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
      render: (row) => (row.requestType === "refill" ? "Refill" : "New"),
    },
  ];

  return (
    <DashboardLayout title="My Requests" subtitle="New material and refill requests you've submitted.">
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-graphite-900 text-white text-sm font-medium hover:bg-graphite-800"
        >
          <LuPlus size={16} /> Add Raw Material
        </button>
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
        emptyMessage={loading ? "Loading..." : "You haven't submitted any requests yet."}
        renderActions={(row) =>
          row.status === "Pending" ? (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleEdit(row)}
                className="p-1.5 rounded border border-graphite-900/15 text-graphite-700 hover:border-amber hover:text-amber-dark"
                title="Edit"
              >
                <LuPencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(row)}
                className="p-1.5 rounded border border-graphite-900/15 text-graphite-700 hover:border-rejected hover:text-rejected"
                title="Delete"
              >
                <LuTrash2 size={14} />
              </button>
            </div>
          ) : (
            <span className="text-graphite-600 text-xs font-mono">—</span>
          )
        }
      />

      {modal && (
        <MaterialFormModal
          mode={modal.mode}
          initialData={modal.initialData}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </DashboardLayout>
  );
};

export default StoreKeeperRequests;
