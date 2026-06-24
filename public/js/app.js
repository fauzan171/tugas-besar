// App.js — SPA Router & Initialization

function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${pageName}`);
  if (target) target.classList.add('active');

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLink = document.querySelector(`[data-page="${pageName}"]`);
  if (navLink) navLink.classList.add('active');

  // Load data for the page
  switch (pageName) {
    case 'standings':
      loadStandings();
      break;
    case 'schedule':
      loadSchedule();
      break;
    case 'bracket':
      loadBracket();
      break;
    case 'admin':
      checkAdminAuth();
      break;
  }
}

// Initialize — show default page
document.addEventListener('DOMContentLoaded', () => {
  showPage('standings');
});
