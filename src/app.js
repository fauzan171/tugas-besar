const express = require("express");
const path = require("path");

// Routes
const authRoutes = require("./routes/auth.routes");
const teamRoutes = require("./routes/team.routes");
const groupRoutes = require("./routes/group.routes");
const matchRoutes = require("./routes/match.routes");
const tournamentRoutes = require("./routes/tournament.routes");
const standingsRoutes = require("./routes/standings.routes");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, "..", "public")));

// API Routes
app.use(authRoutes);
app.use(teamRoutes);
app.use(groupRoutes);
app.use(matchRoutes);
app.use(tournamentRoutes);
app.use(standingsRoutes);

// Fallback — serve index.html for SPA
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  }
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
