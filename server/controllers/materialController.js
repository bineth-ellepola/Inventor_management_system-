const Material = require("../models/Material");

// Build a shared query filter from request query params
const buildFilter = (req, base = {}) => {
  const filter = { ...base };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.unitType) {
    filter.unitType = req.query.unitType;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: "i" };
  }

  return filter;
};

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get the approved inventory (visible to both roles)
// @route   GET /api/materials
// @access  Private
const getInventory = async (req, res) => {
  try {
    // Refill/reduce requests are history entries that adjust an existing
    // material's quantity — only "new" requests represent standalone stock lines
    const filter = buildFilter(req, { status: "Approved", requestType: "new" });
    const { page, limit, skip } = paginate(req);

    const sortField = req.query.sortBy || "name";
    const sortOrder = req.query.order === "desc" ? -1 : 1;

    const [items, total] = await Promise.all([
      Material.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email"),
      Material.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get requests submitted by the logged-in store keeper (any status)
// @route   GET /api/materials/mine
// @access  Private (storekeeper)
const getMyRequests = async (req, res) => {
  try {
    const filter = buildFilter(req, { createdBy: req.user._id });
    const { page, limit, skip } = paginate(req);

    const [items, total] = await Promise.all([
      Material.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("approvedBy", "name email"),
      Material.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get a single material's details
// @route   GET /api/materials/:id
// @access  Private
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email");

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.json(material);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Submit a new material request (new stock or refill)
// @route   POST /api/materials
// @access  Private (storekeeper)
const createMaterial = async (req, res) => {
  try {
    const { name, quantity, category, unitType, requestType, refillTarget } = req.body;

    if (!name || quantity === undefined || !category || !unitType) {
      return res.status(400).json({ message: "name, quantity, category and unitType are required" });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero" });
    }

    if ((requestType === "refill" || requestType === "reduce") && !refillTarget) {
      return res.status(400).json({ message: "refillTarget is required for refill and reduce requests" });
    }

    if (requestType === "reduce") {
      const target = await Material.findById(refillTarget);
      if (!target || target.status !== "Approved") {
        return res.status(400).json({ message: "Target material was not found or is not an approved item" });
      }
      if (quantity > target.quantity) {
        return res.status(400).json({ message: `Cannot reduce more than the current stock (${target.quantity} ${target.unitType})` });
      }
    }

    const validTypes = ["refill", "reduce"];
    const finalRequestType = validTypes.includes(requestType) ? requestType : "new";

    const material = await Material.create({
      name,
      quantity,
      category,
      unitType,
      requestType: finalRequestType,
      refillTarget: finalRequestType !== "new" ? refillTarget : null,
      status: "Pending",
      createdBy: req.user._id,
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a pending request (store keeper can only edit their own, while Pending)
// @route   PUT /api/materials/:id
// @access  Private (storekeeper)
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (material.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own requests" });
    }

    if (material.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be edited" });
    }

    const { name, quantity, category, unitType } = req.body;

    if (name !== undefined) material.name = name;
    if (quantity !== undefined) material.quantity = quantity;
    if (category !== undefined) material.category = category;
    if (unitType !== undefined) material.unitType = unitType;

    await material.save();
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a pending request (store keeper can only delete their own, while Pending)
// @route   DELETE /api/materials/:id
// @access  Private (storekeeper)
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    if (material.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own requests" });
    }

    if (material.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be deleted" });
    }

    await material.deleteOne();
    res.json({ message: "Request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Dashboard stats for the Store Keeper dashboard cards
// @route   GET /api/materials/stats/storekeeper
// @access  Private (storekeeper)
const getStoreKeeperStats = async (req, res) => {
  try {
    const [
      totalMaterials,
      totalChemicals,
      totalPacking,
      totalLabels,
      pendingRequests,
      approvedRequests,
    ] = await Promise.all([
      Material.countDocuments({ status: "Approved", requestType: "new" }),
      Material.countDocuments({ status: "Approved", requestType: "new", category: "Chemical" }),
      Material.countDocuments({ status: "Approved", requestType: "new", category: "Packing Material" }),
      Material.countDocuments({ status: "Approved", requestType: "new", category: "Label" }),
      Material.countDocuments({ createdBy: req.user._id, status: "Pending" }),
      Material.countDocuments({ createdBy: req.user._id, status: "Approved" }),
    ]);

    res.json({
      totalMaterials,
      totalChemicals,
      totalPacking,
      totalLabels,
      pendingRequests,
      approvedRequests,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Dashboard stats for the Manager dashboard cards
// @route   GET /api/materials/stats/manager
// @access  Private (manager)
const getManagerStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [pendingApprovals, approvedToday, totalInventoryItems, rejectedRequests] =
      await Promise.all([
        Material.countDocuments({ status: "Pending" }),
        Material.countDocuments({ status: "Approved", approvedAt: { $gte: startOfDay } }),
        Material.countDocuments({ status: "Approved", requestType: "new" }),
        Material.countDocuments({ status: "Rejected" }),
      ]);

    res.json({ pendingApprovals, approvedToday, totalInventoryItems, rejectedRequests });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getInventory,
  getMyRequests,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getStoreKeeperStats,
  getManagerStats,
};
