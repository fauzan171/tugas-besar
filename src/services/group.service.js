const prisma = require("../lib/prisma");
const { calculateStandings } = require("../utils/standings");

async function getAllGroups() {
  const teams = await prisma.team.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });

  // Group teams by group letter
  const groupsMap = {};
  for (const team of teams) {
    if (!groupsMap[team.group]) {
      groupsMap[team.group] = [];
    }
    groupsMap[team.group].push({
      id: team.id,
      name: team.name,
      code: team.code,
    });
  }

  return Object.entries(groupsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teams]) => ({ group, teams }));
}

async function getGroupStandings(groupId) {
  const group = groupId.toUpperCase();

  const teams = await prisma.team.findMany({
    where: { group },
    orderBy: { name: "asc" },
  });

  if (teams.length === 0) {
    return { error: "Grup tidak ditemukan", status: 404 };
  }

  const matches = await prisma.match.findMany({
    where: {
      phase: "group",
      status: "finished",
      teamA: { group },
    },
  });

  const standings = calculateStandings(matches, teams);

  return { data: { group, standings }, status: 200 };
}

async function getAllStandings() {
  const teams = await prisma.team.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });

  // Get unique groups
  const groups = [...new Set(teams.map((t) => t.group))].sort();

  const allStandings = [];

  for (const group of groups) {
    const groupTeams = teams.filter((t) => t.group === group);

    const matches = await prisma.match.findMany({
      where: {
        phase: "group",
        status: "finished",
        teamA: { group },
      },
    });

    const standings = calculateStandings(matches, groupTeams);
    allStandings.push({ group, standings });
  }

  return { data: allStandings, status: 200 };
}

module.exports = { getAllGroups, getGroupStandings, getAllStandings };
