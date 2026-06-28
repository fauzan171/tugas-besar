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
  if (
    !Number.isInteger(scoreA) ||
    !Number.isInteger(scoreB) ||
    scoreA < 0 ||
    scoreB < 0
  ) {
    return { error: "Skor harus berupa angka integer >= 0", status: 400 };
  }

  // Cek match exists
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    return { error: "Pertandingan tidak ditemukan", status: 404 };
  }

  // Update match saat ini
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

  // Jika semua pertandingan grup selesai, otomatis buat fase knockout
  if (match.phase === "group") {
    const unfinished = await prisma.match.count({
      where: {
        phase: "group",
        status: "scheduled",
      },
    });

    if (unfinished === 0) {
      const tournamentService = require("./tournament.service");

      console.log("Semua pertandingan grup selesai");
      console.log("Membuat jadwal knockout...");

      await tournamentService.advanceToKnockout();
    }
  }

  // Jika match knockout, propagate winner ke next round
  if (updated.phase === "knockout") {
    await propagateWinner(updated, prisma);
  }

  return { data: updated, status: 200 };
}

/**
 * Propagate winner ke match babak berikutnya
 */
async function propagateWinner(match, prisma) {
  console.log("========== PROPAGATE ==========");
  console.log("Bracket Pos:", match.bracketPos);
  console.log(`Skor: ${match.scoreA} - ${match.scoreB}`);

  // Menentukan pemenang berdasarkan skor lapangan
  const winnerId = match.scoreA > match.scoreB ? match.teamAId : match.teamBId;
  console.log("Winner ID =", winnerId);

  const nextMatchMapping = {
    R16_1: { bracketPos: "QF1", side: "teamAId" },
    R16_2: { bracketPos: "QF1", side: "teamBId" },

    R16_3: { bracketPos: "QF2", side: "teamAId" },
    R16_4: { bracketPos: "QF2", side: "teamBId" },

    R16_5: { bracketPos: "QF3", side: "teamAId" },
    R16_6: { bracketPos: "QF3", side: "teamBId" },

    R16_7: { bracketPos: "QF4", side: "teamAId" },
    R16_8: { bracketPos: "QF4", side: "teamBId" },

    QF1: { bracketPos: "SF1", side: "teamAId" },
    QF2: { bracketPos: "SF1", side: "teamBId" },

    QF3: { bracketPos: "SF2", side: "teamAId" },
    QF4: { bracketPos: "SF2", side: "teamBId" },

    SF1: { bracketPos: "FINAL", side: "teamAId" },
    SF2: { bracketPos: "FINAL", side: "teamBId" },
  };

  const next = nextMatchMapping[match.bracketPos];
  if (!next) return; // Babak Final, tidak ada ronde lanjutan

  console.log(`${match.bracketPos} -> ${next.bracketPos} (${next.side})`);

  // 1. Cari pertandingan spesifik yang akan menerima tim pemenang
  const nextMatch = await prisma.match.findFirst({
    where: {
      bracketPos: next.bracketPos,
      phase: "knockout",
      // Catatan: Jika ada sistem tournamentId, tambahkan di sini: tournamentId: match.tournamentId
    },
  });

  if (!nextMatch) {
    console.log(
      `Target pertandingan (${next.bracketPos}) belum di-generate atau tidak ditemukan.`,
    );
    return;
  }

  // 2. Update menggunakan ID unik hasil pencarian di atas
  const updatedNextMatch = await prisma.match.update({
    where: {
      id: nextMatch.id,
    },
    data: {
      [next.side]: winnerId,
    },
  });

  console.log(
    "Berhasil memperbarui babak berikutnya:",
    updatedNextMatch.bracketPos,
  );
}

module.exports = { getAllMatches, updateMatchResult };
