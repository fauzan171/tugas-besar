// Admin Page — Login, Add Team, Input Results, Tournament Controls

function checkAdminAuth() {
  if (authToken) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadMatchSelect();
  } else {
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
  }
}

async function handleLogin() {
  const password = document.getElementById('admin-password').value;

  if (!password) {
    setStatus('login-status', 'Password wajib diisi', 'error');
    return;
  }

  try {
    const data = await api.post('/login', { password });
    authToken = data.token;
    localStorage.setItem('admin_token', authToken);
    setStatus('login-status', 'Login berhasil!', 'success');
    showToast('Login berhasil!', 'success');

    setTimeout(() => {
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      loadMatchSelect();
    }, 500);

  } catch (err) {
    setStatus('login-status', err.message, 'error');
  }
}

function handleLogout() {
  authToken = null;
  localStorage.removeItem('admin_token');
  document.getElementById('admin-login').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-password').value = '';
  setStatus('login-status', '', '');
  showToast('Logged out', 'info');
}

async function handleAddTeam() {
  const name = document.getElementById('team-name').value.trim();
  const code = document.getElementById('team-code').value.trim();
  const group = document.getElementById('team-group').value;

  if (!name || !code) {
    setStatus('team-status', 'Nama tim dan kode wajib diisi', 'error');
    return;
  }

  try {
    await api.post('/teams', { name, code, group });
    setStatus('team-status', `Tim "${name}" (${code.toUpperCase()}) berhasil ditambahkan ke Grup ${group}`, 'success');
    showToast(`Tim ${name} ditambahkan!`, 'success');

    // Clear form
    document.getElementById('team-name').value = '';
    document.getElementById('team-code').value = '';

  } catch (err) {
    setStatus('team-status', err.message, 'error');
  }
}

async function loadMatchSelect() {
  const select = document.getElementById('match-select');

  try {
    const matches = await api.get('/matches');

    if (!matches || matches.length === 0) {
      select.innerHTML = '<option value="">Belum ada pertandingan</option>';
      return;
    }

    let options = '<option value="">-- Pilih pertandingan --</option>';
    for (const m of matches) {
      const teamA = m.teamA || { name: 'TBD', code: '???' };
      const teamB = m.teamB || { name: 'TBD', code: '???' };
      const status = m.status === 'finished' ? '✅' : '⏳';
      const score = m.status === 'finished' ? ` (${m.scoreA}-${m.scoreB})` : '';
      options += `<option value="${m.id}">${status} ${teamA.code} vs ${teamB.code}${score}</option>`;
    }

    select.innerHTML = options;

    // Update score labels when match changes
    select.addEventListener('change', updateScoreLabels);

  } catch (err) {
    select.innerHTML = '<option value="">Gagal memuat pertandingan</option>';
  }
}

function updateScoreLabels() {
  const select = document.getElementById('match-select');
  const matchId = select.value;

  if (!matchId) {
    document.getElementById('score-label-a').textContent = 'Skor Tim A';
    document.getElementById('score-label-b').textContent = 'Skor Tim B';
    return;
  }

  // Get match info from select text
  const option = select.options[select.selectedIndex];
  const text = option.textContent;
  const parts = text.replace(/[✅⏳]/g, '').trim().split(' vs ');

  if (parts.length === 2) {
    document.getElementById('score-label-a').textContent = parts[0].trim();
    document.getElementById('score-label-b').textContent = parts[1].trim().replace(/\(.*\)/, '').trim();
  }
}

async function handleSubmitResult() {
  const matchId = document.getElementById('match-select').value;
  const scoreA = parseInt(document.getElementById('score-a').value);
  const scoreB = parseInt(document.getElementById('score-b').value);

  if (!matchId) {
    setStatus('result-status', 'Pilih pertandingan terlebih dahulu', 'error');
    return;
  }

  if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
    setStatus('result-status', 'Skor harus berupa angka >= 0', 'error');
    return;
  }

  try {
    await api.put(`/matches/${matchId}/result`, { scoreA, scoreB });
    setStatus('result-status', `Hasil berhasil disimpan: ${scoreA} - ${scoreB}`, 'success');
    showToast('Hasil pertandingan disimpan!', 'success');

    // Clear form & reload matches
    document.getElementById('score-a').value = '';
    document.getElementById('score-b').value = '';
    loadMatchSelect();

    // Refresh standings if on standings page
    if (document.getElementById('page-standings').classList.contains('active')) {
      loadStandings();
    }

  } catch (err) {
    setStatus('result-status', err.message, 'error');
  }
}

async function handleSetupTournament() {
  try {
    const data = await api.post('/tournament/setup', {});
    setStatus('tournament-status', data.message + ` (${data.matchesCreated} pertandingan)`, 'success');
    showToast(data.message, 'success');
    loadMatchSelect();
  } catch (err) {
    setStatus('tournament-status', err.message, 'error');
  }
}

async function handleAdvanceKnockout() {
  try {
    const data = await api.post('/tournament/advance', {});
    setStatus('tournament-status', data.message + ` (${data.matchesCreated} pertandingan)`, 'success');
    showToast(data.message, 'success');
    loadMatchSelect();
  } catch (err) {
    setStatus('tournament-status', err.message, 'error');
  }
}

async function handleResetTournament() {
  if (!confirm('Yakin mau reset turnamen? Semua hasil pertandingan akan dihapus.')) {
    return;
  }

  try {
    const data = await api.del('/tournament/reset');
    setStatus('tournament-status', data.message + ` (${data.matchesDeleted} pertandingan dihapus)`, 'success');
    showToast('Turnamen di-reset!', 'info');
    loadMatchSelect();
  } catch (err) {
    setStatus('tournament-status', err.message, 'error');
  }
}
