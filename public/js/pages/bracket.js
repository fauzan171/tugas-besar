// Bracket Page — Knockout Bracket

async function loadBracket() {
  const container = document.getElementById("bracket-container");
  container.innerHTML = '<div class="loading">Memuat bracket...</div>';

  try {
    const data = await api.get("/bracket");

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
  const grouped = {
    "Round of 16": [],
    "Quarter Final": [],
    "Semi Final": [],
    "Third Place": [],
    Final: [],
  };

  data.rounds.forEach((match) => {
    if (match.round === 1) grouped["Round of 16"].push(match);
    else if (match.round === 2) grouped["Quarter Final"].push(match);
    else if (match.round === 3) grouped["Semi Final"].push(match);
    else if (match.round === 4) grouped["Third Place"].push(match);
    else if (match.round === 5) grouped["Final"].push(match);
  });

  let html = '<div class="bracket">';

  const rounds = Object.entries(grouped).filter(
    ([_, matches]) => matches.length,
  );

  rounds.forEach(([title, matches], index) => {
    html += `
        <div class="bracket-round">
            <div class="bracket-round-header">${title}</div>
            ${matches.map(renderBracketMatch).join("")}
        </div>
    `;

    if (index < rounds.length - 1) {
      html += `<div class="bracket-connector"></div>`;
    }
  });

  // Champion
  const finalMatch = grouped["Final"][0];

  let champion = "TBD";

  if (
    finalMatch &&
    finalMatch.status === "finished" &&
    finalMatch.teamA &&
    finalMatch.teamB
  ) {
    champion =
      finalMatch.scoreA > finalMatch.scoreB
        ? finalMatch.teamA.name
        : finalMatch.teamB.name;
  }

  html += `
    <div class="bracket-champion">
      <div class="champion-trophy">🏆</div>
      <div class="champion-label">Champion</div>
      <div class="champion-name">${champion}</div>
    </div>
  `;

  html += "</div>";

  return html;
}

function renderBracketMatch(match) {
  const teamA = match.teamA || { name: "TBD", code: "???" };
  const teamB = match.teamB || { name: "TBD", code: "???" };
  const isFinished = match.status === "finished";

  let aClass = "";
  let bClass = "";

  if (isFinished) {
    if (match.scoreA > match.scoreB) {
      aClass = "winner";
      bClass = "loser";
    } else if (match.scoreB > match.scoreA) {
      bClass = "winner";
      aClass = "loser";
    }
  }

  const aIsTbd =
    teamA.name === "TBD" || teamA.code === "TBD" || teamA.code === "???";
  const bIsTbd =
    teamB.name === "TBD" || teamB.code === "TBD" || teamB.code === "???";

  return `
    <div class="bracket-match">
      <div class="bracket-match-team ${aClass}">
        <span class="team-name ${aIsTbd ? "tbd" : ""}">${teamA.name}</span>
        <span class="team-score">${isFinished ? match.scoreA : ""}</span>
      </div>
      <div class="bracket-match-team ${bClass}">
        <span class="team-name ${bIsTbd ? "tbd" : ""}">${teamB.name}</span>
        <span class="team-score">${isFinished ? match.scoreB : ""}</span>
      </div>
    </div>
  `;
}
document.addEventListener("DOMContentLoaded", loadBracket);
