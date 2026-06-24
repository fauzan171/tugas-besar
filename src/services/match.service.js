const prisma = require("../lib/prisma");

async function getAllMatches({ phase, status } = {}) {
  const where = {};
  if (phase) where.phase = phase;
  if (status) where.status = status;

  const matches = await prisma.match.findMany({
    where,
    include: {
      teamA: { select: { id: true, name: true, code: true } },
      teamB: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ phase: "asc" }, { round: "asc" }, { id: "asc" }],
  });

  return matches;
}

async function updateMatchResult(matchId, { scoreA, scoreB }) {
  const id = parseInt(matchId);

  // Validasi skor
  if (scoreA === undefined || scoreB === undefined) {
    return { error: "Skor tim A dan tim B wajib diisi", status: 400 };
  }
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0) {
    return { error: "Skor harus berupa angka integer >= 0", status: 400 };
  }

  // Cek match exists
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    return { error: "Pertandingan tidak ditemukan", status: 404 };
  }

  // Update match
  const updated = await prisma.match.update({
    where: { id },
    data: {
      scoreA,
      scoreB,
      status: "finished",
    },
    include: {
      teamA: { select: { id: true, name: true, code: true } },
      teamB: { select: { id: true, name: true, code: true } },
    },
  });

  // Jika match knockout, propagate winner ke next round
  if (match.phase === "knockout") {
    await propagateWinner(match, prisma);
  }

  return { data: updated, status: 200 };
}

/**
 * Propagate winner ke match babak berikutnya
 */
async function propagateWinner(match, prisma) {
  const winnerId = match.scoreA > match.scoreB ? match.teamAId : match.teamBId;

  const nextMatchMapping = {
    QF1: { bracketPos: "SF1", side: "teamAId" },
    QF2: { bracketPos: "SF1", side: "teamBId" },
    QF3: { bracketPos: "SF2", side: "teamAId" },
    QF4: { bracketPos: "SF2", side: "teamBId" },
    QF5: { bracketPos: "SF3", side: "teamAId" },
    QF6: { bracketPos: "SF3", side: "teamBId" },
    QF7: { bracketPos: "SF4", side: "teamAId" },
    QF8: { bracketPos: "SF4", side: "teamBId" },
    SF1: { bracketPos: "F1", side: "teamAId" },
    SF2: { bracketPos: "F1", side: "teamBId" },
    SF3: { bracketPos: "F2", side: "teamAId" },
    SF4: { bracketPos: "F2", side: "teamBId" },
    F1: { bracketPos: "FINAL", side: "teamAId" },
    F2: { bracketPos: "FINAL", side: "teamBId" },
  };

  const next = nextMatchMapping[match.bracketPos];
  if (!next) return; // Final, tidak ada next

  await prisma.match.updateMany({
    where: {
      bracketPos: next.bracketPos,
      phase: "knockout",
    },
    data: {
      [next.side]: winnerId,
    },
  });
}

module.exports = { getAllMatches, updateMatchResult };
