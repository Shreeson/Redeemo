const API_BASE = window.REDEEMO_API_BASE || 'http://localhost:5500/api';

const Auth = {
  getToken() {
    return localStorage.getItem('redeemo_token');
  },
  setSession(token, user) {
    localStorage.setItem('redeemo_token', token);
    localStorage.setItem('redeemo_user', JSON.stringify(user));
  },
  getUser() {
    const raw = localStorage.getItem('redeemo_user');
    return raw ? JSON.parse(raw) : null;
  },
  updateCoins(coins) {
    const user = Auth.getUser();
    if (user) {
      user.coins = coins;
      localStorage.setItem('redeemo_user', JSON.stringify(user));
    }
  },
  clearSession() {
    localStorage.removeItem('redeemo_token');
    localStorage.removeItem('redeemo_user');
  },
  isLoggedIn() {
    return !!Auth.getToken();
  },
  // Call at the top of any page that requires login
  requireAuth() {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'index.html';
    }
  },
};

async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      Auth.clearSession();
      window.location.href = 'index.html';
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

function showToast(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function renderNav(activePage) {
  const user = Auth.getUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const links = [
    { href: 'dashboard.html', label: 'Home' },
    { href: 'earn.html', label: 'Earn' },
    { href: 'redeem.html', label: 'Redeem' },
    { href: 'about.html', label: 'About' },
    { href: 'feedback.html', label: 'Feedback' },
  ];

  nav.innerHTML = `
    <a class="brand" href="dashboard.html"><span class="ticket-icon"></span>Redeemo</a>
    <ul class="nav-links">
      ${links
        .map(
          (l) =>
            `<li><a href="${l.href}" class="${activePage === l.href ? 'active' : ''}">${l.label}</a></li>`
        )
        .join('')}
    </ul>
    <div style="display:flex; align-items:center; gap:12px;">
      <span class="coin-pill" id="nav-coins">${user ? user.coins : 0} tix</span>
      <button class="btn-logout" id="logout-btn">Log out</button>
    </div>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.clearSession();
    window.location.href = 'index.html';
  });
}

function updateNavCoins(coins) {
  Auth.updateCoins(coins);
  const el = document.getElementById('nav-coins');
  if (el) el.textContent = `${coins} tix`;
}
