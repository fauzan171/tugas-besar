const prisma = require("../lib/prisma");
const { calculateStandings, generateRoundRobin } = require("../utils/standings");

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

    // Assign round numbers (simple: sequential)
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
    },
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
    const matches = await prisma.match.findMany({
      where: { phase: "group", status: "finished", teamA: { group } },
    });
    standingsByGroup[group] = calculateStandings(matches, groupTeams);
  }

  // Ambil top 2 dari setiap grup
  const qualified = [];
  for (const group of groups) {
    const sorted = standingsByGroup[group];
    if (sorted.length < 2) {
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
  const matches = [];
  const numTeams = qualified.length;

  // Bracket pairing:
  // 1A vs 2B, 1C vs 2D, ... (atas)
  // 1B vs 2A, 1D vs 2C, ... (bawah)
  const half = numTeams / 2;

  for (let i = 0; i < half; i++) {
    const team1 = qualified[i]; // 1st place dari grup ke-i
    const team2 = qualified[numTeams - 1 - i]; // 2nd place dari grup terakhir-i

    matches.push({
      teamAId: team1.teamId,
      teamBId: team2.teamId,
      phase: "knockout",
      status: "scheduled",
      round: 1,
      bracketPos: `QF${i + 1}`,
    });
  }

  // Semi-finals (placeholder)
  const numSF = half / 2;
  for (let i = 0; i < numSF; i++) {
    matches.push({
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 2,
      bracketPos: `SF${i + 1}`,
    });
  }

  // Finals (2 legs or 1 — let's do 2 legs: F1, F2)
  // Actually for simplicity, let's do 2 semifinal winners → 1 final
  // But to handle 4 SFs, let's do F1 (SF1 vs SF2), F2 (SF3 vs SF4)
  if (numSF > 2) {
    // 2 final bracket positions
    matches.push({
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 3,
      bracketPos: "F1",
    });
    matches.push({
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 3,
      bracketPos: "F2",
    });
    // Grand Final
    matches.push({
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 4,
      bracketPos: "FINAL",
    });
  } else {
    // Just 2 SFs → 1 Final
    matches.push({
      teamAId: null,
      teamBId: null,
      phase: "knockout",
      status: "scheduled",
      round: 3,
      bracketPos: "FINAL",
    });
  }

  return matches;
}

async function getBracket() {
  const matches = await prisma.match.findMany({
    where: { phase: "knockout" },
    include: {
      teamA: { select: { id: true, name: true, code: true } },
      teamB: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ round: "asc" }, { bracketPos: "asc" }],
  });

  if (matches.length === 0) {
    return {
      data: { message: "Fase knockout belum dimulai", rounds: [] },
      status: 200,
    };
  }

  // Group by round
  const roundNames = {
    1: "Quarter-final",
    2: "Semi-final",
    3: "Final",
    4: "Grand Final",
  };

  const roundsMap = {};
  for (const match of matches) {
    const roundKey = match.round;
    if (!roundsMap[roundKey]) {
      roundsMap[roundKey] = {
        round: roundKey,
        name: roundNames[roundKey] || `Round ${roundKey}`,
        matches: [],
      };
    }

    roundsMap[roundKey].matches.push({
      id: match.id,
      teamA: match.teamA || { name: "TBD", code: "TBD" },
      teamB: match.teamB || { name: "TBD", code: "TBD" },
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.status,
      bracketPos: match.bracketPos,
    });
  }

  const rounds = Object.values(roundsMap).sort((a, b) => a.round - b.round);

  return { data: { phase: "knockout", rounds }, status: 200 };
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
