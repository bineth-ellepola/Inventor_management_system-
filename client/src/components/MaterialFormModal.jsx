import React, { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";

const CATEGORIES = ["Chemical", "Packing Material", "Label"];
const UNITS = ["kg", "g", "cm", "bundle", "cubes", "litres", "rolls", "boxes", "pieces"];

/**
 * mode: "add" | "refill" | "edit"
 * initialData: material being edited or refilled
 */
const MaterialFormModal = ({ mode, initialData, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    quantity: initialData?.quantity || "",
    category: initialData?.category || CATEGORIES[0],
    unitType: initialData?.unitType || UNITS[0],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        name: mode === "refill" ? initialData.name : initialData.name,
        quantity: mode === "refill" ? "" : initialData.quantity,
        category: initialData.category,
        unitType: initialData.unitType,
      });
    }
  }, [initialData, mode]);

  const titles = {
    add: "Add Raw Material",
    refill: "Refill Material",
    edit: "Edit Pending Request",
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Material name is required");
    if (!form.quantity || Number(form.quantity) <= 0)
      return setError("Quantity must be greater than zero");

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      category: form.category,
      unitType: form.unitType,
    };

    if (mode === "refill") {
      payload.requestType = "refill";
      payload.refillTarget = initialData._id;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-graphite-950/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-graphite-900/10">
          <h2 className="font-display text-lg font-semibold text-graphite-900">
            {titles[mode]}
          </h2>
          <button onClick={onClose} className="text-graphite-600 hover:text-graphite-900">
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-rejected bg-rejected/10 border border-rejected/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-graphite-600 mb-1.5">
              Material Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={mode === "refill"}
              className="w-full px-3 py-2 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none disabled:bg-paper-dim"
              placeholder="e.g. Acetone"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-graphite-600 mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-graphite-600 mb-1.5">
                Unit Type
              </label>
              <select
                value={form.unitType}
                onChange={(e) => handleChange("unitType", e.target.value)}
                disabled={mode === "refill"}
                className="w-full px-3 py-2 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none bg-white disabled:bg-paper-dim"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-graphite-600 mb-1.5">
              Material Category
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              disabled={mode === "refill"}
              className="w-full px-3 py-2 text-sm border border-graphite-900/15 rounded-md focus:border-amber outline-none bg-white disabled:bg-paper-dim"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-md border border-graphite-900/15 text-graphite-700 hover:bg-paper-dim"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-md bg-graphite-900 text-white hover:bg-graphite-800 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialFormModal;
