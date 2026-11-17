require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const materialRoutes = require("./routes/materialRoutes");
const approvalRoutes = require("./routes/approvalRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "NIMS API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/approvals", approvalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5050;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`NIMS API running on port ${PORT}`);
  });
});
