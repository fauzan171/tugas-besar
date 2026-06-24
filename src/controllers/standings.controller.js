const groupService = require("../services/group.service");

async function getAllStandings(req, res) {
  try {
    const result = await groupService.getAllStandings();
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("getAllStandings error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getAllStandings };
