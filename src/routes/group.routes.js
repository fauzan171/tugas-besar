const { Router } = require("express");
const groupController = require("../controllers/group.controller");

const router = Router();

// GET /groups — Semua grup beserta anggotanya (publik)
router.get("/groups", groupController.getGroups);

// GET /groups/:id/standings — Klasemen satu grup (publik)
router.get("/groups/:id/standings", groupController.getGroupStandings);

module.exports = router;
