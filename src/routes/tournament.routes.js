const { Router } = require("express");
const tournamentController = require("../controllers/tournament.controller");
const authMiddleware = require("../middleware/auth");

const router = Router();

// POST /tournament/setup — Inisialisasi jadwal fase grup (auth required)
router.post("/tournament/setup", authMiddleware, tournamentController.setup);

// POST /tournament/advance — Generate bracket knockout (auth required)
router.post("/tournament/advance", authMiddleware, tournamentController.advance);

// GET /bracket — Lihat bracket fase knockout (publik)
router.get("/bracket", tournamentController.getBracket);

// DELETE /tournament/reset — Reset turnamen (auth required, bonus)
router.delete("/tournament/reset", authMiddleware, tournamentController.reset);

module.exports = router;
