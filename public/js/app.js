/* ============================================================
   app.js — SPA bootstrap, routing, auth, and global UI helpers
   Auto-logs in as admin — no login screen shown.
   ============================================================ */

// ─── State ─────────────────────────────────────────────────
let _currentPage = 'dashboard';

// Default admin credentials (matches seed.js)
const AUTO_LOGIN = { email: 'admin@restaurant.com', password: 'admin123' };

// ─── Silent auto-login ──────────────────────────────────────
async function initApp() {
  // If we already have a token stored, jump straight in
  const savedToken = localStorage.getItem('rms_token');
  const savedUser  = JSON.parse(localStorage.getItem('rms_user') || 'null');
  if (savedToken && savedUser) {
    applyUserSession(savedUser);
    showApp();
    return;
  }

  // Otherwise auto-login with the seeded admin account
  try {
    const data = await api.login(AUTO_LOGIN);
    localStorage.setItem('rms_token', data.token);
    localStorage.setItem('rms_user',  JSON.stringify(data.user));
    applyUserSession(data.user);
    showApp();
  } catch (err) {
    // If auto-login fails (server not up yet or credentials wrong),
    // show a minimal reconnect banner instead of a full login form
    document.body.innerHTML = `
      <div style="
        min-height:100vh;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:1rem;
        background:#080b12;color:#f1f5f9;font-family:Inter,sans-serif">
        <span style="font-size:2.5rem">🍽️</span>
        <h2 style="font-size:1.4rem;font-weight:700">RestaurantOS</h2>
        <p style="color:#64748b;font-size:.9rem">Could not connect: ${err.message}</p>
        <button onclick="location.reload()"
          style="background:#f59e0b;color:#0d0f14;border:none;border-radius:9px;
                 padding:.65rem 1.5rem;font-weight:700;cursor:pointer;font-size:.9rem">
          ↻ Retry
        </button>
      </div>`;
  }
}

function applyUserSession(user) {
  window._userName = user.name;
  document.getElementById('user-name-small').textContent = user.name;
  document.getElementById('user-role-small').textContent = user.role === 'admin' ? 'Administrator' : 'Staff';
  document.getElementById('user-avatar').textContent = (user.name || 'U')[0].toUpperCase();
}

function logout() {
  localStorage.removeItem('rms_token');
  localStorage.removeItem('rms_user');
  toast('Signed out — reconnecting…', 'info');
  setTimeout(initApp, 800);
}

// ─── App Bootstrap ──────────────────────────────────────────
function showApp() {
  // Hide login screen (if still visible), show app
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  navigate('dashboard');
  startClock();
  // Auto-refresh active page every 60 seconds
  setInterval(refreshCurrentPage, 60000);
}

window.addEventListener('DOMContentLoaded', initApp);

// ─── Routing ─────────────────────────────────────────────────
const pages = {
  dashboard:    { title: 'Dashboard',    render: renderDashboard    },
  menu:         { title: 'Menu',         render: renderMenu         },
  tables:       { title: 'Tables',       render: renderTables       },
  orders:       { title: 'Orders',       render: renderOrders       },
  reservations: { title: 'Reservations', render: renderReservations },
  inventory:    { title: 'Inventory',    render: renderInventory    },
  reports:      { title: 'Reports',      render: renderReports      },
};

function navigate(page) {
  if (!pages[page]) return;
  _currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update page title
  document.getElementById('page-title').textContent = pages[page].title;

  // Render page
  pages[page].render();

  // Auto-close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function refreshCurrentPage() {
  if (pages[_currentPage]) pages[_currentPage].render();
}

// ─── Sidebar toggle (mobile) ──────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('menu-toggle');
  if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && e.target !== toggle) {
      sidebar.classList.remove('open');
    }
  }
});

// ─── Clock ───────────────────────────────────────────────────
function startClock() {
  function tick() {
    document.getElementById('clock').textContent =
      new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

// ─── Modal ───────────────────────────────────────────────────
function openModal(title, bodyHtml, lg = false) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML   = bodyHtml;
  document.getElementById('modal').classList.toggle('modal-lg', lg);
  document.getElementById('modal-overlay').classList.add('open');
  // Focus first input
  setTimeout(() => {
    const first = document.querySelector('#modal-body input, #modal-body select');
    if (first) first.focus();
  }, 50);
}

function closeModal(e) {
  // If called from overlay click, only close if target IS the overlay
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

// Close modal with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('modal-overlay').classList.remove('open');
});

// ─── Toast notifications ──────────────────────────────────
function toast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-text">${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}
