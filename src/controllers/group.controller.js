const groupService = require("../services/group.service");

async function getGroups(req, res) {
  try {
    const groups = await groupService.getAllGroups();
    return res.status(200).json(groups);
  } catch (err) {
    console.error("getGroups error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getGroupStandings(req, res) {
  try {
    const result = await groupService.getGroupStandings(req.params.id);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error("getGroupStandings error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getGroups, getGroupStandings };
