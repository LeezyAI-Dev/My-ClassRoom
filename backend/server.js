const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

let dbModule;
try {
  dbModule = require("./db");
  console.log("📦 DB module chargé");
} catch(e) {
  console.error("❌ Erreur chargement db.js:", e.message);
  process.exit(1);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

function tryLoadRouter(routePath) {
  const fullPath = path.join(__dirname, routePath + ".js");
  if (!fs.existsSync(fullPath)) return null;
  try {
    const mod = require(`./${routePath}`);
    const router = mod.router || mod.default || mod;
    if (typeof router !== "function") return null;
    return router;
  } catch (e) {
    console.log(`❌ Erreur ${routePath}: ${e.message}`);
    return null;
  }
}

async function start() {
  try {
    if (dbModule.init) await dbModule.init();
    else if (dbModule.initDb) await dbModule.initDb();
    console.log("✅ DB initialisée");
  } catch (e) {
    console.error("❌ Erreur init DB:", e.message);
  }

  // Auth
  let r = tryLoadRouter("routes/studentAuth") || tryLoadRouter("routes/students");
  if (r) { app.use("/api/students", r); console.log("✅ /api/students"); }
  r = tryLoadRouter("routes/devAuth") || tryLoadRouter("routes/developerAuth") || tryLoadRouter("routes/developers");
  if (r) { app.use("/api/developers", r); console.log("✅ /api/developers"); }
  r = tryLoadRouter("routes/auth");
  if (r) { app.use("/api/auth", r); console.log("✅ /api/auth"); }

  // BANNERS - on monte sur les 2 chemins pour fixer le 404
  const bannerRouter = tryLoadRouter("routes/banners") || tryLoadRouter("routes/banner");
  if (bannerRouter) {
    app.use("/api/banners", bannerRouter);
    app.use("/api/banner", bannerRouter); // <- FIX pour ton frontend qui appelle /api/banner
    console.log("✅ /api/banners + /api/banner -> même route");
  }

  r = tryLoadRouter("routes/eyes");
  if (r) { app.use("/api/eyes", r); console.log("✅ /api/eyes"); }
  r = tryLoadRouter("routes/subjects");
  if (r) { app.use("/api/subjects", r); console.log("✅ /api/subjects"); }
  r = tryLoadRouter("routes/schedule");
  if (r) { app.use("/api/schedule", r); console.log("✅ /api/schedule"); }
  r = tryLoadRouter("routes/grades");
  if (r) { app.use("/api/grades", r); console.log("✅ /api/grades"); }

  app.get("/", (req, res) => res.json({ ok: true, v: "LOCAL-FIX-ULTIMATE" }));

  app.use((err, req, res, next) => {
    console.error("❌ Erreur route:", err.message);
    res.status(500).json({ error: err.message });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 My Classroom LOCAL sur http://localhost:${PORT}`));
}

start();
