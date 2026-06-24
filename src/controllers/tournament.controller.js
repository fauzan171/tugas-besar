const tournamentService = require("../services/tournament.service");

async function setup(req, res) {
  try {
    const result = await tournamentService.setupGroupStage();

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("setup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function advance(req, res) {
  try {
    const result = await tournamentService.advanceToKnockout();

    if (result.error) {
      return res.status(result.status).json({ error: result.error, details: result.details });
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("advance error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getBracket(req, res) {
  try {
    const result = await tournamentService.getBracket();
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("getBracket error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function reset(req, res) {
  try {
    const result = await tournamentService.resetTournament();
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("reset error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { setup, advance, getBracket, reset };
