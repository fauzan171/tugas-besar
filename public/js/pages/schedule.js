// Schedule Page — Jadwal & Hasil

async function loadSchedule() {
  const container = document.getElementById('schedule-container');
  container.innerHTML = '<div class="loading">Memuat jadwal...</div>';

  const phase = document.getElementById('filter-phase').value;
  const status = document.getElementById('filter-status').value;

  try {
    let url = '/matches';
    const params = [];
    if (phase) params.push(`phase=${phase}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += '?' + params.join('&');

    const matches = await api.get(url);

    if (!matches || matches.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">Belum ada pertandingan.<br>Gunakan Admin Panel untuk setup turnamen.</div>
        </div>
      `;
      return;
    }

    // Group matches by group (for group phase) or by phase/round (for knockout)
    const grouped = groupMatches(matches);
    let html = '';

    for (const group of grouped) {
      html += renderScheduleGroup(group);
    }

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">Gagal memuat jadwal: ${err.message}</div>
      </div>
    `;
  }
}

function groupMatches(matches) {
  const groups = {};

  for (const match of matches) {
    let key, label;

    if (match.phase === 'knockout') {
      const roundNames = { 1: 'Quarter-final', 2: 'Semi-final', 3: 'Final', 4: 'Grand Final' };
      key = `knockout-${match.round}`;
      label = `🎯 ${roundNames[match.round] || 'Round ' + match.round}`;
    } else {
      // Group phase — group by team's group and round
      const groupName = match.teamA?.group || '?';
      key = `group-${groupName}-${match.round || 1}`;
      label = `GRUP ${groupName} — Round ${match.round || '?'}`;
    }

    if (!groups[key]) {
      groups[key] = { key, label, matches: [] };
    }
    groups[key].matches.push(match);
  }

  return Object.values(groups);
}

function renderScheduleGroup(group) {
  const matchCards = group.matches.map(m => renderMatchCard(m)).join('');

  return `
    <div class="schedule-group">
      <div class="schedule-group-header">
        <span class="schedule-group-name">${group.label}</span>
      </div>
      ${matchCards}
    </div>
  `;
}

function renderMatchCard(match) {
  const isFinished = match.status === 'finished';
  const teamA = match.teamA || { name: 'TBD', code: '???' };
  const teamB = match.teamB || { name: 'TBD', code: '???' };

  let scoreHtml;
  if (isFinished) {
    scoreHtml = `
      <span class="score">${match.scoreA}</span>
      <span class="score-separator">-</span>
      <span class="score">${match.scoreB}</span>
    `;
  } else {
    scoreHtml = `<span class="vs">vs</span>`;
  }

  return `
    <div class="match-card ${match.status}">
      <div class="match-team home">
        <span class="team-code">${teamA.code}</span>
        <span class="team-name">${teamA.name}</span>
      </div>
      <div class="match-score">
        ${scoreHtml}
      </div>
      <div class="match-team away">
        <span class="team-name">${teamB.name}</span>
        <span class="team-code">${teamB.code}</span>
      </div>
      <div class="match-status">
        ${isFinished ? '✅' : '⏳'}
      </div>
    </div>
  `;
}
