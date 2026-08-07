const express = require("express");
const {
  getInventory,
  getMyRequests,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getStoreKeeperStats,
  getManagerStats,
} = require("../controllers/materialController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.get("/stats/storekeeper", authorize("storekeeper"), getStoreKeeperStats);
router.get("/stats/manager", authorize("manager"), getManagerStats);

router.get("/mine", authorize("storekeeper"), getMyRequests);

router.route("/")
  .get(getInventory)
  .post(authorize("storekeeper"), createMaterial);

router.route("/:id")
  .get(getMaterialById)
  .put(authorize("storekeeper"), updateMaterial)
  .delete(authorize("storekeeper"), deleteMaterial);

module.exports = router;
