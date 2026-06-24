const teamService = require("../services/team.service");

async function getTeams(req, res) {
  try {
    const teams = await teamService.getAllTeams();
    return res.status(200).json(teams);
  } catch (err) {
    console.error("getTeams error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function createTeam(req, res) {
  try {
    const { name, code, group } = req.body;
    const result = await teamService.createTeam({ name, code, group });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("createTeam error:", err);
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Kode tim sudah digunakan" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getTeamStats(req, res) {
  try {
    const result = await teamService.getTeamStats(req.params.id);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("getTeamStats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getTeams, createTeam, getTeamStats };
