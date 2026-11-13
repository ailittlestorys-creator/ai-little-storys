import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import dns from "node:dns";
import https from "node:https";
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  dns.setDefaultResultOrder("ipv4first");
  https.globalAgent.options.family = 4;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
