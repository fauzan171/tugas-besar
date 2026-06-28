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
/**
 * Propagate winner ke match babak berikutnya & loser ke perebutan juara 3 jika semifinal
 */
async function propagateWinner(match, prisma) {
  console.log("========== PROPAGATE ==========");
  console.log("Bracket Pos:", match.bracketPos);
  console.log(`Skor: ${match.scoreA} - ${match.scoreB}`);

  // 1. Tentukan Pemenang dan Pecundang
  const winnerId = match.scoreA > match.scoreB ? match.teamAId : match.teamBId;
  const loserId = match.scoreA > match.scoreB ? match.teamBId : match.teamAId;

  console.log("Winner ID =", winnerId);
  console.log("Loser ID =", loserId);

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
  
  // Jika tidak ada next mapping dan bukan perebutan juara 3, berarti ini pertandingan FINAL / THIRD itu sendiri
  if (!next) return; 

  console.log(`${match.bracketPos} -> ${next.bracketPos} (${next.side})`);

  // 2. Update Pemenang ke Babak Berikutnya (QF, SF, atau FINAL)
  const nextMatch = await prisma.match.findFirst({
    where: {
      bracketPos: next.bracketPos,
      phase: "knockout",
    },
  });

  if (nextMatch) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { [next.side]: winnerId },
    });
    console.log(`Berhasil mengirim pemenang ke ${next.bracketPos}`);
  }

  // 3. TAMBAHKAN LOGIKA INI: Jika pertandingan yang selesai adalah Semifinal, kirim pecundang ke babak THIRD
  if (match.bracketPos === "SF1" || match.bracketPos === "SF2") {
    const thirdPlaceSide = match.bracketPos === "SF1" ? "teamAId" : "teamBId";
    
    const thirdMatch = await prisma.match.findFirst({
      where: {
        bracketPos: "THIRD",
        phase: "knockout",
      },
    });

    if (thirdMatch) {
      await prisma.match.update({
        where: { id: thirdMatch.id },
        data: { [thirdPlaceSide]: loserId },
      });
      console.log(`Berhasil mengirim tim kalah (${loserId}) ke babak THIRD posisi ${thirdPlaceSide}`);
    }
  }
}

module.exports = { getAllMatches, updateMatchResult };
