const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");

let isConnected = false;

async function init() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
    console.log("MongoDB Connected");
  }
}

// تشغيل محلي
if (process.env.VERCEL !== "1") {
  (async () => {
    await init();

    app.listen(env.port, () => {
      console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
    });
  })();
}

// تشغيل على Vercel
module.exports = async (req, res) => {
  await init();
  return app(req, res);
};