const matchService = require("../services/match.service");

async function getMatches(req, res) {
  try {
    const { phase, status } = req.query;
    const matches = await matchService.getAllMatches({ phase, status });
    return res.status(200).json(matches);
  } catch (err) {
    console.error("getMatches error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateMatchResult(req, res) {
  try {
    const { scoreA, scoreB } = req.body;
    const result = await matchService.updateMatchResult(req.params.id, {
      scoreA: scoreA !== undefined ? parseInt(scoreA) : undefined,
      scoreB: scoreB !== undefined ? parseInt(scoreB) : undefined,
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("updateMatchResult error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getMatches, updateMatchResult };
