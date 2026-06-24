const { Router } = require("express");
const teamController = require("../controllers/team.controller");
const authMiddleware = require("../middleware/auth");

const router = Router();

// GET /teams — Semua tim (publik)
router.get("/teams", teamController.getTeams);

// GET /teams/:id/stats — Statistik tim (publik, bonus)
router.get("/teams/:id/stats", teamController.getTeamStats);

// POST /teams — Tambah tim baru (auth required)
router.post("/teams", authMiddleware, teamController.createTeam);

module.exports = router;
