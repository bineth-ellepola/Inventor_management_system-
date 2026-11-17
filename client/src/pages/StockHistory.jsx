import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import MaterialTable from "../components/MaterialTable";
import { getStockHistory, downloadMonthlyStockReport } from "../services/materialService";

const emptyData = { items: [], page: 1, total: 0, totalPages: 1 };
const formatDate = (value) => value ? new Date(value).toLocaleString("en-GB", {
  timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short",
}) : "Date unavailable";

export default function StockHistory() {
  const [params] = useSearchParams();
  const materialId = params.get("materialId") || "";
  const [filters, setFilters] = useState({ search: "", category: "", direction: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [reportMonth, setReportMonth] = useState(() => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
    return `${parts.find((part) => part.type === "year").value}-${parts.find((part) => part.type === "month").value}`;
  });
  const [downloading, setDownloading] = useState(false);
  const [reportError, setReportError] = useState("");
  const downloadReport = async () => {
    setDownloading(true);
    setReportError("");
    try { await downloadMonthlyStockReport(reportMonth); }
    catch (err) { setReportError(err.message); }
    finally { setDownloading(false); }
  };
  const changeFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setData(emptyData);
    getStockHistory({ ...filters, materialId, page, limit: 10 })
      .then((result) => { if (active) setData(result); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load stock history. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, materialId, page, retry]);

  const columns = [
    { key: "approvedAt", label: "Changed at (Sri Lanka)", render: (row) => formatDate(row.approvedAt) },
    { key: "name", label: "Material" },
    { key: "category", label: "Category" },
    { key: "requestType", label: "Change", render: (row) => row.requestType === "reduce" ? "Reduction" : "Increase" },
    { key: "quantity", label: "Quantity changed", render: (row) => (
      <span className={`font-mono ${row.requestType === "reduce" ? "text-rejected" : "text-green-700"}`}>
        {row.requestType === "reduce" ? "−" : "+"}{row.quantity} {row.unitType}
      </span>
    ) },
    { key: "createdBy", label: "Requested by", render: (row) => row.createdBy?.name || "Unavailable" },
    { key: "approvedBy", label: "Approved by", render: (row) => row.approvedBy?.name || "Unavailable" },
  ];

  return (
    <DashboardLayout title="Stock History" subtitle="Approved increases and reductions, newest first. Dates show when the manager approved the stock change (Sri Lanka time).">
      <section className="bg-white border border-graphite-900/10 rounded-md p-4 mb-5">
        <h2 className="font-semibold">Monthly stock report</h2>
        <p className="text-sm text-graphite-600 mt-1">Download all approved increases and reductions for the selected month, with totals per material. Covers all materials regardless of the history filters below.</p>
        <div className="flex flex-wrap items-end gap-3 mt-3">
          <label className="text-sm">Report month
            <input type="month" min="1900-01" value={reportMonth} disabled={downloading} onChange={(e) => setReportMonth(e.target.value)} className="block border rounded p-2 mt-1" />
          </label>
          <button onClick={downloadReport} disabled={downloading || !reportMonth} className="rounded bg-graphite-900 text-white px-4 py-2 text-sm disabled:opacity-50">
            {downloading ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>
        {reportError && <p role="alert" className="text-sm text-rejected mt-3">{reportError}</p>}
      </section>
      {materialId && <p className="mb-4 text-sm">Showing changes for the selected inventory item. <Link className="underline" to="/manager/stock-history" onClick={() => setPage(1)}>View all materials</Link></p>}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <label>Change type
          <select className="block border rounded p-2 mt-1" value={filters.direction} onChange={(e) => changeFilter("direction", e.target.value)}>
            <option value="">All changes</option><option value="refill">Increases</option><option value="reduce">Reductions</option>
          </select>
        </label>
        <label>From date<input className="block border rounded p-2 mt-1" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => changeFilter("from", e.target.value)} /></label>
        <label>To date<input className="block border rounded p-2 mt-1" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => changeFilter("to", e.target.value)} /></label>
      </div>
      {error && <p role="alert" className="mb-4 text-rejected">{error} <button className="underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></p>}
      <MaterialTable columns={columns} data={data} search={filters.search} onSearchChange={(value) => changeFilter("search", value)}
        category={filters.category} onCategoryChange={(value) => changeFilter("category", value)} onPageChange={setPage} showStatus={false}
        emptyMessage={loading ? "Loading stock history..." : error ? "Stock history could not be loaded." : "No approved stock changes found for these filters."} />
    </DashboardLayout>
  );
}
