// Bracket Page — Knockout Bracket

async function loadBracket() {
  const container = document.getElementById('bracket-container');
  container.innerHTML = '<div class="loading">Memuat bracket...</div>';

  try {
    const data = await api.get('/bracket');

    if (!data.rounds || data.rounds.length === 0) {
      container.innerHTML = `
        <div class="bracket-empty">
          <div class="bracket-empty-icon">🎯</div>
          <h3>Bracket Knockout</h3>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">
            Fase knockout belum dimulai.<br>
            Selesaikan semua pertandingan grup, lalu gunakan Admin Panel untuk advance ke knockout.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = renderBracket(data);

  } catch (err) {
    container.innerHTML = `
      <div class="bracket-empty">
        <div class="bracket-empty-icon">⚠️</div>
        <p>Gagal memuat bracket: ${err.message}</p>
      </div>
    `;
  }
}

function renderBracket(data) {
  const rounds = data.rounds;
  let html = '<div class="bracket">';

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    html += `
      <div class="bracket-round">
        <div class="bracket-round-header">${round.name}</div>
        ${round.matches.map(m => renderBracketMatch(m)).join('')}
      </div>
    `;

    // Add connector column between rounds
    if (i < rounds.length - 1) {
      html += '<div class="bracket-connector"></div>';
    }
  }

  // Champion section
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches[finalRound.matches.length - 1];
  let championName = 'TBD';
  let isTbd = true;

  if (finalMatch && finalMatch.status === 'finished') {
    championName = finalMatch.scoreA > finalMatch.scoreB
      ? finalMatch.teamA.name
      : finalMatch.teamB.name;
    isTbd = false;
  }

  html += `
    <div class="bracket-connector"></div>
    <div class="bracket-champion">
      <div class="champion-trophy">🏆</div>
      <div class="champion-label">Champion</div>
      <div class="champion-name ${isTbd ? 'tbd' : ''}">${championName}</div>
    </div>
  `;

  html += '</div>';
  return html;
}

function renderBracketMatch(match) {
  const teamA = match.teamA || { name: 'TBD', code: '???' };
  const teamB = match.teamB || { name: 'TBD', code: '???' };
  const isFinished = match.status === 'finished';

  let aClass = '';
  let bClass = '';

  if (isFinished) {
    if (match.scoreA > match.scoreB) {
      aClass = 'winner';
      bClass = 'loser';
    } else if (match.scoreB > match.scoreA) {
      bClass = 'winner';
      aClass = 'loser';
    }
  }

  const aIsTbd = teamA.name === 'TBD' || teamA.code === 'TBD' || teamA.code === '???';
  const bIsTbd = teamB.name === 'TBD' || teamB.code === 'TBD' || teamB.code === '???';

  return `
    <div class="bracket-match">
      <div class="bracket-match-team ${aClass}">
        <span class="team-name ${aIsTbd ? 'tbd' : ''}">${teamA.name}</span>
        <span class="team-score">${isFinished ? match.scoreA : ''}</span>
      </div>
      <div class="bracket-match-team ${bClass}">
        <span class="team-name ${bIsTbd ? 'tbd' : ''}">${teamB.name}</span>
        <span class="team-score">${isFinished ? match.scoreB : ''}</span>
      </div>
    </div>
  `;
}
