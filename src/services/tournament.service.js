const prisma = require("../lib/prisma");
const {
  calculateStandings,
  generateRoundRobin,
} = require("../utils/standings");

async function setupGroupStage() {
  // Cek apakah jadwal grup sudah ada
  const existingGroupMatches = await prisma.match.count({
    where: { phase: "group" },
  });

  if (existingGroupMatches > 0) {
    return {
      data: { message: "Jadwal fase grup sudah ada", matchesCreated: 0 },
      status: 200,
    };
  }

  // Ambil semua tim, kelompokkan per grup
  const teams = await prisma.team.findMany({
    orderBy: [{ group: "asc" }, { id: "asc" }],
  });

  if (teams.length === 0) {
    return { error: "Belum ada tim yang didaftarkan", status: 400 };
  }

  const groupsMap = {};
  for (const team of teams) {
    if (!groupsMap[team.group]) groupsMap[team.group] = [];
    groupsMap[team.group].push(team);
  }

  // Cek setiap grup minimal 2 tim
  for (const [group, groupTeams] of Object.entries(groupsMap)) {
    if (groupTeams.length < 2) {
      return {
        error: `Grup ${group} harus memiliki minimal 2 tim`,
        status: 400,
      };
    }
  }

  // Generate round-robin matches untuk setiap grup
  let totalCreated = 0;

  for (const [group, groupTeams] of Object.entries(groupsMap)) {
    const pairs = generateRoundRobin(groupTeams);

    // Assign round numbers (sequential)
    const matchData = pairs.map((pair, index) => ({
      teamAId: pair.teamAId,
      teamBId: pair.teamBId,
      phase: "group",
      status: "scheduled",
      round: Math.floor(index / Math.ceil(groupTeams.length / 2)) + 1,
    }));

    await prisma.match.createMany({ data: matchData });
    totalCreated += matchData.length;
  }

  return {
    data: {
      message: "Jadwal fase grup berhasil dibuat",
      matchesCreated: totalCreated,
    }, // <-- Titik koma nakal sudah dibuang dan disarangkan dengan benar
    status: 200,
  };
}

async function advanceToKnockout() {
  // Cek apakah knockout sudah ada
  const existingKnockout = await prisma.match.count({
    where: { phase: "knockout" },
  });

  if (existingKnockout > 0) {
    return {
      data: { message: "Fase knockout sudah ada", matchesCreated: 0 },
      status: 200,
    };
  }

  // Cek semua match grup sudah finished
  const unfinishedGroup = await prisma.match.count({
    where: { phase: "group", status: "scheduled" },
  });

  if (unfinishedGroup > 0) {
    return {
      error: "Masih ada pertandingan fase grup yang belum selesai",
      details: `${unfinishedGroup} pertandingan belum dimainkan`,
      status: 400,
    };
  }

  // Ambil semua tim & hitung standings per grup
  const teams = await prisma.team.findMany({
    orderBy: [{ group: "asc" }, { id: "asc" }],
  });

  const groups = [...new Set(teams.map((t) => t.group))].sort();

  const standingsByGroup = {};
  for (const group of groups) {
    const groupTeams = teams.filter((t) => t.group === group);

    // Ambil match jika teamA ATAU teamB yang berada di grup tersebut
    const matches = await prisma.match.findMany({
      where: {
        phase: "group",
        status: "finished",
        OR: [{ teamA: { group: group } }, { teamB: { group: group } }],
      },
    });
    standingsByGroup[group] = calculateStandings(matches, groupTeams);
  }

  // Ambil top 2 dari setiap grup
  const qualified = [];
  for (const group of groups) {
    const sorted = standingsByGroup[group];
    if (!sorted || sorted.length < 2) {
      return {
        error: `Grup ${group} harus memiliki minimal 2 tim untuk fase knockout`,
        status: 400,
      };
    }
    qualified.push({ teamId: sorted[0].teamId, group, rank: 1 });
    qualified.push({ teamId: sorted[1].teamId, group, rank: 2 });
  }

  // Generate bracket
  const knockoutMatches = generateKnockoutMatches(qualified);

  // Simpan ke database
  await prisma.match.createMany({ data: knockoutMatches });

  return {
    data: {
      message: "Fase knockout berhasil dibuat",
      matchesCreated: knockoutMatches.length,
    },
    status: 200,
  };
}

function generateKnockoutMatches(qualified) {
  const get = (group, rank) => {
    const found = qualified.find((t) => t.group === group && t.rank === rank);
    return found ? found.teamId : null;
  };

  return [
    // =========================
    // ROUND OF 16
    // =========================
    {
      teamAId: get("A", 1),
      teamBId: get("B", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_1",
    },
    {
      teamAId: get("C", 1),
      teamBId: get("D", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_2",
    },
    {
      teamAId: get("E", 1),
      teamBId: get("F", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_3",
    },
    {
      teamAId: get("G", 1),
      teamBId: get("H", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_4",
    },
    {
      teamAId: get("B", 1),
      teamBId: get("A", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_5",
    },
    {
      teamAId: get("D", 1),
      teamBId: get("C", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_6",
    },
    {
      teamAId: get("F", 1),
      teamBId: get("E", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_7",
    },
    {
      teamAId: get("H", 1),
      teamBId: get("G", 2),
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: "R16_8",
    },

    // =========================
    // QUARTER FINAL
    // =========================
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 2,
      bracketPos: "QF1",
    },
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 2,
      bracketPos: "QF2",
    },
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 2,
      bracketPos: "QF3",
    },
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 2,
      bracketPos: "QF4",
    },

    // =========================
    // SEMIFINAL
    // =========================
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 3,
      bracketPos: "SF1",
    },
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 3,
      bracketPos: "SF2",
    },

    // =========================
    // 3RD PLACE
    // =========================
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 4,
      bracketPos: "THIRD",
    },

    // =========================
    // FINAL
    // =========================
    {
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 5,
      bracketPos: "FINAL",
    },
  ];
}

async function getBracket() {
  const matches = await prisma.match.findMany({
    where: { phase: "knockout" },
    include: { teamA: true, teamB: true },
    orderBy: [{ round: "asc" }, { id: "asc" }],
  });

  return {
    status: 200,
    data: { rounds: matches },
  };
}

async function resetTournament() {
  const deleted = await prisma.match.deleteMany({});
  return {
    data: {
      message: "Turnamen berhasil di-reset",
      matchesDeleted: deleted.count,
    },
    status: 200,
  };
}

module.exports = {
  setupGroupStage,
  advanceToKnockout,
  getBracket,
  resetTournament,
};
