const mongoose = require("mongoose");
const Material = require("../models/Material");

// Approved adjustment requests are retained after stock changes. Their quantity
// and approvedAt describe the movement, unlike the mutable inventory balance.
const getStockHistory = async (req, res) => {
  try {
    const filter = { status: "Approved", requestType: { $in: ["refill", "reduce"] } };
    const { search, category, direction, materialId, from, to } = req.query;
    if (search) filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (category) filter.category = category;
    if (direction) {
      if (!["refill", "reduce"].includes(direction)) {
        return res.status(400).json({ message: "Invalid stock change type" });
      }
      filter.requestType = direction;
    }
    if (materialId) {
      if (!mongoose.isObjectIdOrHexString(materialId)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      filter.refillTarget = materialId;
    }
    // Date inputs and displayed timestamps use Sri Lanka time consistently.
    const dateBoundary = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
      const utc = new Date(`${value}T00:00:00Z`);
      if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) return null;
      return new Date(`${value}T00:00:00+05:30`);
    };
    const start = from ? dateBoundary(from) : null;
    const end = to ? dateBoundary(to) : null;
    if ((from && !start) || (to && !end) || (start && end && start > end)) {
      return res.status(400).json({ message: "Enter a valid date range" });
    }
    if (start || end) {
      filter.approvedAt = {};
      if (start) filter.approvedAt.$gte = start;
      if (end) filter.approvedAt.$lt = new Date(end.getTime() + 86400000);
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const [items, total] = await Promise.all([
      Material.find(filter)
        .select("name category quantity unitType requestType refillTarget approvedAt createdBy approvedBy")
        .sort({ approvedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("createdBy", "name")
        .populate("approvedBy", "name"),
      Material.countDocuments(filter),
    ]);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    res.status(500).json({ message: "Unable to load stock history" });
  }
};

const getMonthlyStockReport = async (req, res) => {
  const { monthRange, createMonthlyStockPdf } = require("../utils/monthlyStockReport");
  const range = monthRange(req.query.month);
  if (!range) return res.status(400).json({ message: "Select a valid report month (YYYY-MM)" });
  try {
    // Fetch the entire month, independent of the history table's pagination/filters.
    const items = await Material.find({
      status: "Approved",
      requestType: { $in: ["refill", "reduce"] },
      approvedAt: { $gte: range.start, $lt: range.end },
    }).sort({ approvedAt: 1, _id: 1 }).populate("createdBy", "name").populate("approvedBy", "name").lean();
    const pdf = await createMonthlyStockPdf(req.query.month, items);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="stock-report-${req.query.month}.pdf"`);
    res.set("Cache-Control", "no-store");
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: "Unable to generate monthly stock report" });
  }
};

module.exports = { getStockHistory, getMonthlyStockReport };
