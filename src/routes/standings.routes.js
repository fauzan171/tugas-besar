const { Router } = require("express");
const standingsController = require("../controllers/standings.controller");

const router = Router();

// GET /standings — Klasemen semua grup sekaligus (publik)
router.get("/standings", standingsController.getAllStandings);

module.exports = router;
