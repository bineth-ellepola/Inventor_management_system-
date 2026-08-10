const express = require("express");
const {
  getPendingRequests,
  getApprovalHistory,
  updatePendingRequest,
  approveRequest,
  rejectRequest,
} = require("../controllers/approvalController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, authorize("manager"));

router.get("/", getPendingRequests);
router.get("/history", getApprovalHistory);
router.put("/:id", updatePendingRequest);
router.put("/:id/approve", approveRequest);
router.put("/:id/reject", rejectRequest);

module.exports = router;
