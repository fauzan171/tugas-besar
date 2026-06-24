const { Router } = require("express");
const authController = require("../controllers/auth.controller");

const router = Router();

// POST /login — Login admin, dapat JWT
router.post("/login", authController.login);

module.exports = router;
