const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    category: {
      type: String,
      enum: ["Chemical", "Packing Material", "Label"],
      required: [true, "Material category is required"],
    },
    unitType: {
      type: String,
      enum: [
        "kg",
        "g",
        "cm",
        "bundle",
        "cubes",
        "litres",
        "rolls",
        "boxes",
        "pieces",
      ],
      required: [true, "Unit type is required"],
    },
    // "refill" requests add to an existing approved material and "reduce"
    // requests subtract from one, instead of creating a brand new inventory
    // line once approved
    requestType: {
      type: String,
      enum: ["new", "refill", "reduce"],
      default: "new",
    },
    // If this is a refill/reduce request, points at the existing approved material
    refillTarget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

materialSchema.index({ name: "text" });

module.exports = mongoose.model("Material", materialSchema);
