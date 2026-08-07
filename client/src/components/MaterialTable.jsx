import React from "react";
import { LuSearch, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import StatusStamp from "./StatusStamp";

const CATEGORIES = ["Chemical", "Packing Material", "Label"];

/**
 * columns: array of { key, label, render?(row) }
 * data: { items, page, limit, total, totalPages }
 */
const MaterialTable = ({
  columns,
  data,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onPageChange,
  showStatus = true,
  emptyMessage = "No materials found.",
  renderActions,
}) => {
  const { items = [], page = 1, totalPages = 1, total = 0 } = data || {};

  return (
    <div className="bg-white border border-graphite-900/10 rounded-md shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-graphite-900/10">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-600" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by material name..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-widest text-graphite-600 bg-paper-dim">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              {showStatus && <th className="px-4 py-3 font-medium">Status</th>}
              {renderActions && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (showStatus ? 1 : 0) + (renderActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-graphite-600"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {items.map((row) => (
              <tr key={row._id} className="ledger-row">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-graphite-900">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {showStatus && (
                  <td className="px-4 py-3">
                    <StatusStamp status={row.status} />
                  </td>
                )}
                {renderActions && (
                  <td className="px-4 py-3 text-right">{renderActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-graphite-900/10 font-mono text-xs text-graphite-600">
        <span>{total} record{total !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={page <= 1}
            className="p-1.5 rounded border border-graphite-900/15 disabled:opacity-30 hover:border-amber"
          >
            <LuChevronLeft size={14} />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
            className="p-1.5 rounded border border-graphite-900/15 disabled:opacity-30 hover:border-amber"
          >
            <LuChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialTable;
