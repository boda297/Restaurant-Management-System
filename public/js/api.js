/* ============================================================
   api.js — Centralised HTTP client for RestaurantOS
   All fetch calls go through here so auth headers and base
   URL are managed in one place.
   ============================================================ */

const BASE = '/api';

function getToken() {
  return localStorage.getItem('rms_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// Convenience helpers
const api = {
  get:    (path)         => request(path),
  post:   (path, body)   => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  (path, body)   => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),

  // ── Auth ────────────────────────────────────────────────
  login:    (body) => api.post('/auth/login',    body),
  register: (body) => api.post('/auth/register', body),

  // ── Menu ────────────────────────────────────────────────
  getMenu:        ()       => api.get('/menu'),
  createMenuItem: (body)   => api.post('/menu', body),
  updateMenuItem: (id, b)  => api.patch(`/menu/${id}`, b),

  // ── Tables ──────────────────────────────────────────────
  getTables:          () => api.get('/tables'),
  getAvailableTables: () => api.get('/tables/available'),
  createTable:    (body)  => api.post('/tables', body),

  // ── Orders ──────────────────────────────────────────────
  getOrders:      ()      => api.get('/orders'),
  placeOrder:     (body)  => api.post('/orders', body),
  updateStatus:   (id, s) => api.patch(`/orders/${id}/status`, { status: s }),

  // ── Reservations ────────────────────────────────────────
  getReservations:    ()      => api.get('/reservations'),
  createReservation:  (body)  => api.post('/reservations', body),
  cancelReservation:  (id)    => api.delete(`/reservations/${id}`),

  // ── Inventory ───────────────────────────────────────────
  getInventory:       () => api.get('/inventory'),
  getLowStock:        () => api.get('/inventory/low-stock'),
  createInventory:    (b)     => api.post('/inventory', b),
  restock:            (id, b) => api.patch(`/inventory/${id}/restock`, b),

  // ── Reports ─────────────────────────────────────────────
  getDailySales:  () => api.get('/reports/daily-sales'),
  getStockAlerts: () => api.get('/reports/stock-alerts'),
};
