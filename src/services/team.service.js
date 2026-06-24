const prisma = require("../lib/prisma");

async function getAllTeams() {
  const teams = await prisma.team.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });
  return teams;
}

async function getTeamById(id) {
  const team = await prisma.team.findUnique({
    where: { id: parseInt(id) },
  });
  return team;
}

async function createTeam({ name, code, group }) {
  if (!name || !code || !group) {
    return { error: "Nama tim, kode, dan grup wajib diisi", status: 400 };
  }

  // Cek duplikat kode
  const existing = await prisma.team.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (existing) {
    return { error: `Kode tim '${code.toUpperCase()}' sudah digunakan`, status: 400 };
  }

  const team = await prisma.team.create({
    data: {
      name,
      code: code.toUpperCase(),
      group: group.toUpperCase(),
    },
  });

  return { data: team, status: 201 };
}

async function getTeamStats(teamId) {
  const id = parseInt(teamId);
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    return { error: "Tim tidak ditemukan", status: 404 };
  }

  const matches = await prisma.match.findMany({
    where: {
      status: "finished",
      OR: [{ teamAId: id }, { teamBId: id }],
    },
  });

  const stats = {
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    groupStage: { matches: 0, wins: 0, draws: 0, losses: 0 },
    knockoutStage: { matches: 0, wins: 0, draws: 0, losses: 0 },
  };

  for (const match of matches) {
    const isTeamA = match.teamAId === id;
    const gf = isTeamA ? match.scoreA : match.scoreB;
    const ga = isTeamA ? match.scoreB : match.scoreA;

    stats.totalMatches++;
    stats.goalsFor += gf;
    stats.goalsAgainst += ga;

    const stage = match.phase === "group" ? stats.groupStage : stats.knockoutStage;
    stage.matches++;

    if (gf > ga) {
      stats.wins++;
      stats.points += 3;
      stage.wins++;
    } else if (gf === ga) {
      stats.draws++;
      stats.points += 1;
      stage.draws++;
    } else {
      stats.losses++;
      stage.losses++;
    }
  }

  stats.goalDiff = stats.goalsFor - stats.goalsAgainst;

  return {
    data: {
      team: { id: team.id, name: team.name, code: team.code, group: team.group },
      stats,
    },
    status: 200,
  };
}

module.exports = { getAllTeams, getTeamById, createTeam, getTeamStats };
