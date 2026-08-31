require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const authRoutes = require("./routes/auth");
const studentAuthRoutes = require("./routes/studentAuth");
const subjectsRoutes = require("./routes/subjects");
const scheduleRoutes = require("./routes/schedule");
const { router: resourcesRoutes, UPLOAD_DIR } = require("./routes/resources");
const resourceActionsRoutes = require("./routes/resourceActions");
const { router: bannerRoutes } = require("./routes/banner");
const { router: eyesRoutes } = require("./routes/eyes");
const { requireAuth } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auth/student", studentAuthRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/subjects", resourcesRoutes); // /api/subjects/:id/resources[...]
app.use("/api/resources", resourceActionsRoutes); // /api/resources/:id (suppression)
app.use("/api/schedule", scheduleRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/eyes", eyesRoutes);

// Fichiers PDF uploadés, servis tels quels (nom aléatoire, lecture seule).
app.use("/uploads", express.static(UPLOAD_DIR));

// Route protégée minimale : confirme juste que le token est valide.
// Sert de base pour le futur tableau de bord développeur.
app.get("/api/dashboard/ping", requireAuth, (req, res) => {
  res.json({ message: `Bienvenue ${req.developer.username}, page blanche prête.` });
});

app.get("/", (req, res) => {
  res.json({ status: "My ClassRoom API - V1" });
});

const PORT = process.env.PORT || 4000;

// On attend que les tables Turso soient prêtes avant d'accepter des requêtes.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`My ClassRoom backend démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur lors de l'initialisation de la base de données Turso :", err);
    process.exit(1);
  });