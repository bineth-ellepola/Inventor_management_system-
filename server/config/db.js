const mongoose = require("mongoose");
const dns = require("node:dns");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error(
        "MONGO_URI is not defined. Copy .env.example to .env and set your connection string."
      );
    }

    if (process.env.DNS_SERVERS) {
      dns.setServers(process.env.DNS_SERVERS.split(",").map((server) => server.trim()));
    }

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
