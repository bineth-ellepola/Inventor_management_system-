const Material = require("../models/Material");

const paginate = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// @desc    Get all pending requests awaiting manager approval
// @route   GET /api/approvals
// @access  Private (manager)
const getPendingRequests = async (req, res) => {
  try {
    const filter = { status: "Pending" };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

    const { page, limit, skip } = paginate(req);

    const [items, total] = await Promise.all([
      Material.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("refillTarget", "name quantity unitType"),
      Material.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get approval history (approved + rejected requests)
// @route   GET /api/approvals/history
// @access  Private (manager)
const getApprovalHistory = async (req, res) => {
  try {
    const filter = { status: { $in: ["Approved", "Rejected"] } };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

    const { page, limit, skip } = paginate(req);

    const [items, total] = await Promise.all([
      Material.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email"),
      Material.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Approve a pending request
// @route   PUT /api/approvals/:id/approve
// @access  Private (manager)
const approveRequest = async (req, res) => {
  try {
    const request = await Material.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ message: "This request has already been reviewed" });
    }

    // Refill requests add their quantity onto the existing approved material
    if (request.requestType === "refill" && request.refillTarget) {
      const target = await Material.findById(request.refillTarget);

      if (!target || target.status !== "Approved") {
        return res.status(400).json({ message: "Refill target material was not found or is not an approved item" });
      }

      target.quantity += request.quantity;
      await target.save();

      request.status = "Approved";
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
      await request.save();

      return res.json({ message: "Refill approved and merged into inventory", target, request });
    }

    // Reduce requests subtract their quantity from the existing approved material
    if (request.requestType === "reduce" && request.refillTarget) {
      const target = await Material.findById(request.refillTarget);

      if (!target || target.status !== "Approved") {
        return res.status(400).json({ message: "Target material was not found or is not an approved item" });
      }

      if (request.quantity > target.quantity) {
        return res.status(400).json({
          message: `Cannot reduce more than the current stock (${target.quantity} ${target.unitType})`,
        });
      }

      target.quantity -= request.quantity;
      await target.save();

      request.status = "Approved";
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
      await request.save();

      return res.json({ message: "Reduction approved and deducted from inventory", target, request });
    }

    request.status = "Approved";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    res.json({ message: "Request approved", request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update the quantity of a pending refill or reduction request
// @route   PUT /api/approvals/:id
// @access  Private (manager)
const updatePendingRequest = async (req, res) => {
  try {
    const request = await Material.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be edited" });
    }
    if (!["refill", "reduce"].includes(request.requestType) || !request.refillTarget) {
      return res.status(400).json({ message: "Only refill and reduction requests can be edited here" });
    }

    const quantity = Number(req.body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero" });
    }

    const target = await Material.findById(request.refillTarget);
    if (!target || target.status !== "Approved") {
      return res.status(400).json({ message: "Target material was not found or is not an approved item" });
    }
    if (request.requestType === "reduce" && quantity > target.quantity) {
      return res.status(400).json({
        message: `Cannot reduce more than the current stock (${target.quantity} ${target.unitType})`,
      });
    }

    request.quantity = quantity;
    await request.save();
    await request.populate([
      { path: "createdBy", select: "name email" },
      { path: "refillTarget", select: "name quantity unitType" },
    ]);

    res.json({ message: "Request quantity updated", request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reject a pending request
// @route   PUT /api/approvals/:id/reject
// @access  Private (manager)
const rejectRequest = async (req, res) => {
  try {
    const request = await Material.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ message: "This request has already been reviewed" });
    }

    request.status = "Rejected";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    request.rejectionReason = req.body.reason || "";
    await request.save();

    res.json({ message: "Request rejected", request });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getPendingRequests,
  getApprovalHistory,
  updatePendingRequest,
  approveRequest,
  rejectRequest,
};
