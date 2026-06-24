// Standings Page — Klasemen Grup

async function loadStandings() {
  const container = document.getElementById('standings-container');
  container.innerHTML = '<div class="loading">Memuat klasemen...</div>';

  try {
    const data = await api.get('/standings');

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <div class="empty-state-text">Belum ada data klasemen.<br>Mulai dengan menambahkan tim dan setup turnamen di Admin Panel.</div>
        </div>
      `;
      return;
    }

    let html = '';
    for (const group of data) {
      html += renderGroupStandings(group);
    }
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">Gagal memuat klasemen: ${err.message}</div>
      </div>
    `;
  }
}

function renderGroupStandings(group) {
  const rows = group.standings.map((s, i) => {
    const gdClass = s.goalDiff > 0 ? 'positive' : s.goalDiff < 0 ? 'negative' : '';
    const qualifyClass = i < 2 ? 'qualify' : '';
    const gdDisplay = s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff;

    return `
      <tr class="${qualifyClass}">
        <td class="col-rank">${s.rank}</td>
        <td class="col-team">
          <span class="team-code">${s.code}</span>
          ${s.team}
        </td>
        <td>${s.played}</td>
        <td>${s.won}</td>
        <td>${s.drawn}</td>
        <td>${s.lost}</td>
        <td>${s.goalsFor}</td>
        <td>${s.goalsAgainst}</td>
        <td class="col-gd ${gdClass}">${gdDisplay}</td>
        <td class="col-points">${s.points}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="standings-group">
      <div class="standings-group-header">
        <span class="standings-group-badge">GRUP ${group.group}</span>
        <span class="standings-group-label">Top 2 lolos ke knockout</span>
      </div>
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tim</th>
            <th>M</th>
            <th>MN</th>
            <th>S</th>
            <th>K</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Poin</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
