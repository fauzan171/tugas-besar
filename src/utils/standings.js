/**
 * Hitung klasemen dari array pertandingan yang sudah finished
 * @param {Array} matches - Array of finished matches dalam satu grup
 * @param {Array} teams - Array of teams dalam grup tersebut
 * @returns {Array} Standings sorted by points desc, goalDiff desc, goalsFor desc
 */
function calculateStandings(matches, teams) {
  // Inisialisasi stats untuk setiap tim
  const stats = {};
  for (const team of teams) {
    stats[team.id] = {
      teamId: team.id,
      team: team.name,
      code: team.code,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
  }

  // Proses setiap match yang sudah finished
  for (const match of matches) {
    if (match.status !== "finished") continue;

    const a = stats[match.teamAId];
    const b = stats[match.teamBId];
    if (!a || !b) continue;

    a.played++;
    b.played++;

    a.goalsFor += match.scoreA;
    a.goalsAgainst += match.scoreB;
    b.goalsFor += match.scoreB;
    b.goalsAgainst += match.scoreA;

    if (match.scoreA > match.scoreB) {
      a.won++;
      a.points += 3;
      b.lost++;
    } else if (match.scoreA < match.scoreB) {
      b.won++;
      b.points += 3;
      a.lost++;
    } else {
      a.drawn++;
      a.points += 1;
      b.drawn++;
      b.points += 1;
    }
  }

  // Hitung goal difference & sort
  const sorted = Object.values(stats)
    .map((s) => ({ ...s, goalDiff: s.goalsFor - s.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

  // Assign rank
  sorted.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return sorted;
}

/**
 * Generate semua pertandingan round-robin untuk satu grup
 * @param {Array} teams - Array of team objects { id }
 * @returns {Array} Array of { teamAId, teamBId } pairs
 */
function generateRoundRobin(teams) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        teamAId: teams[i].id,
        teamBId: teams[j].id,
      });
    }
  }
  return matches;
}

module.exports = { calculateStandings, generateRoundRobin };
