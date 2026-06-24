const { Router } = require("express");
const matchController = require("../controllers/match.controller");
const authMiddleware = require("../middleware/auth");

const router = Router();

// GET /matches — Semua pertandingan, bisa filter ?phase=&status= (publik)
router.get("/matches", matchController.getMatches);

// PUT /matches/:id/result — Input hasil pertandingan (auth required)
router.put("/matches/:id/result", authMiddleware, matchController.updateMatchResult);

module.exports = router;
