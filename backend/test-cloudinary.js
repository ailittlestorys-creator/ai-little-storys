const https = require("node:https");

const req = https.get(
  {
    hostname: "api.cloudinary.com",
    port: 443,
    path: "/",
    family: 4, // Force IPv4
    timeout: 15000,
  },
  (res) => {
    console.log("Status:", res.statusCode);
    console.log("Cloudinary connection successful");
    res.resume();
  },
);

req.on("error", (error) => {
  console.error("Connection failed:", error);
});

req.on("timeout", () => {
  console.error("Request timed out");
  req.destroy();
});
