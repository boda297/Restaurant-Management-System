/* ============================================================
   pages.js — All page render functions for RestaurantOS SPA
   ============================================================ */

// ─── Utilities ─────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateTime(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + fmtTime(d);
}
function statusBadge(s) {
  return `<span class="badge badge-${s}">${s}</span>`;
}
function categoryBadge(c) {
  const key = (c || '').toLowerCase().replace(' ', '-');
  return `<span class="badge badge-${key === 'main-course' ? 'main' : key}">${c}</span>`;
}
function emptySt(icon, text) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-text">${text}</div></div>`;
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
async function renderDashboard() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const [sales, tables, orders, alerts] = await Promise.all([
      api.getDailySales().catch(() => ({ data: { totalRevenue: 0, orderCount: 0 } })),
      api.getTables().catch(() => ({ data: [] })),
      api.getOrders().catch(() => ({ data: [] })),
      api.getStockAlerts().catch(() => ({ data: [] })),
    ]);

    const tableList  = tables.data  || [];
    const orderList  = orders.data  || [];
    const alertList  = alerts.data  || [];
    const available  = tableList.filter(t => t.status === 'available').length;
    const occupied   = tableList.filter(t => t.status === 'occupied').length;

    // Today's orders
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayOrders = orderList.filter(o => new Date(o.createdAt) >= todayStart);
    const activeOrders = orderList.filter(o => ['pending','preparing','served'].includes(o.status));

    // Update badge
    const badge = document.getElementById('badge-orders');
    if (activeOrders.length) { badge.textContent = activeOrders.length; badge.style.display = ''; }
    else badge.style.display = 'none';

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Good ${greeting()}, ${window._userName || 'Admin'} 👋</h1>
          <p>${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Today's Revenue</div>
            <div class="stat-value">${fmt(sales.data.totalRevenue)}</div>
            <div class="stat-sub">${sales.data.orderCount} paid orders</div>
          </div>
          <div class="stat-icon amber">💰</div>
        </div>
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Available Tables</div>
            <div class="stat-value">${available}</div>
            <div class="stat-sub">${occupied} occupied · ${tableList.filter(t=>t.status==='reserved').length} reserved</div>
          </div>
          <div class="stat-icon green">🪑</div>
        </div>
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Active Orders</div>
            <div class="stat-value">${activeOrders.length}</div>
            <div class="stat-sub">${todayOrders.length} orders today total</div>
          </div>
          <div class="stat-icon blue">🧾</div>
        </div>
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Stock Alerts</div>
            <div class="stat-value" style="color:${alertList.length?'var(--red)':'var(--green)'}">${alertList.length}</div>
            <div class="stat-sub">${alertList.length ? 'Items need restocking' : 'All levels healthy'}</div>
          </div>
          <div class="stat-icon red">⚠️</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:1.25rem">
        <!-- Table status -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🪑 Table Overview</div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('tables')">View all</button>
          </div>
          <div class="card-body">
            ${tableList.length
              ? `<div class="tables-visual-grid">${tableList.map(t => `
                  <div class="table-chip ${t.status}">
                    <div class="chip-num">#${t.number}</div>
                    <div class="chip-cap">${t.seatingCapacity} seats</div>
                    <div class="chip-status">${t.status}</div>
                  </div>`).join('')}</div>`
              : emptySt('🪑', 'No tables configured')
            }
          </div>
        </div>

        <!-- Recent orders -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🧾 Today's Orders</div>
            <button class="btn btn-ghost btn-sm" onclick="navigate('orders')">View all</button>
          </div>
          <div class="card-body">
            ${todayOrders.length
              ? todayOrders.slice(0, 8).map(o => `
                  <div class="order-mini">
                    <div class="order-mini-left">
                      <div class="order-mini-title">Table #${o.table?.number ?? '?'}</div>
                      <div class="order-mini-meta">${fmtTime(o.createdAt)} · ${o.items?.length || 0} items</div>
                    </div>
                    <div class="order-mini-right">
                      ${statusBadge(o.status)}
                      <span class="order-mini-total">${fmt(o.total)}</span>
                    </div>
                  </div>`).join('')
              : emptySt('🧾', 'No orders today yet')
            }
          </div>
        </div>
      </div>

      <!-- Stock alerts -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚠️ Low Stock Alerts</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('inventory')">Manage stock</button>
        </div>
        <div class="card-body">
          ${alertList.length
            ? alertList.map(item => {
                const pct = Math.min((item.quantity / (item.lowStockThreshold * 2 || 1)) * 100, 100);
                const cls = pct < 30 ? 'low' : pct < 60 ? 'mid' : 'ok';
                return `
                  <div class="stock-alert-item">
                    <div class="stock-alert-name">${item.name}</div>
                    <div class="stock-bar-wrap"><div class="stock-bar ${cls}" style="width:${pct}%"></div></div>
                    <div class="stock-alert-qty">${item.quantity} / ${item.lowStockThreshold} ${item.unit}</div>
                  </div>`;
              }).join('')
            : emptySt('✅', 'All stock levels are healthy')
          }
        </div>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><div>${e.message}</div></div>`;
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening';
}

// ═══════════════════════════════════════════════════════════
//  MENU
// ═══════════════════════════════════════════════════════════
async function renderMenu() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const [menuRes, invRes] = await Promise.all([api.getMenu(), api.getInventory().catch(() => ({ data: [] }))]);
    const items = menuRes.data || [];
    const invItems = invRes.data || [];
    window._invItems = invItems; // cache for modal

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Menu</h1>
          <p>${items.length} item${items.length !== 1 ? 's' : ''} · manage dishes and recipes</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openAddMenuModal()">+ Add Item</button>
        </div>
      </div>
      ${items.length
        ? `<div class="menu-grid">${items.map(item => menuCard(item)).join('')}</div>`
        : emptySt('🍴', 'No menu items yet — add your first dish!')
      }`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div>${e.message}</div></div>`;
  }
}

function menuCard(item) {
  const recipeHtml = item.recipe?.length
    ? item.recipe.map(r => `<span style="font-size:.72rem;color:var(--text3)">${r.inventoryItem?.name||'?'} ×${r.amountUsed}</span>`).join(' · ')
    : '<span style="font-size:.72rem;color:var(--text3)">No recipe</span>';
  return `
    <div class="menu-card${!item.isAvailable ? ' unavailable-overlay' : ''}">
      <div class="menu-card-header">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-price">${fmt(item.price)}</div>
      </div>
      <div>${categoryBadge(item.category)} ${!item.isAvailable ? '<span class="badge" style="background:rgba(239,68,68,.12);color:var(--red)">Unavailable</span>' : ''}</div>
      ${item.description ? `<div class="menu-card-desc">${item.description}</div>` : ''}
      <div style="font-size:.75rem;color:var(--text3);border-top:1px solid var(--border);padding-top:.5rem;margin-top:.25rem">
        🧪 ${recipeHtml}
      </div>
      <div class="menu-card-footer">
        <div></div>
        <div class="menu-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="openEditMenuModal('${item._id}')">✏️ Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="toggleAvailability('${item._id}', ${!item.isAvailable})">${item.isAvailable ? '🚫 Disable' : '✅ Enable'}</button>
        </div>
      </div>
    </div>`;
}

async function toggleAvailability(id, val) {
  try {
    await api.updateMenuItem(id, { isAvailable: val });
    toast(`Item ${val ? 'enabled' : 'disabled'}`, 'success');
    renderMenu();
  } catch (e) { toast(e.message, 'error'); }
}

function openAddMenuModal() {
  openModal('Add Menu Item', menuForm(null));
}
async function openEditMenuModal(id) {
  try {
    const items = (await api.getMenu()).data || [];
    const item = items.find(i => i._id === id);
    if (!item) return;
    openModal('Edit Menu Item', menuForm(item));
  } catch (e) { toast(e.message, 'error'); }
}

function menuForm(item) {
  const inv = window._invItems || [];
  const recipeRows = (item?.recipe || []).map((r, i) => recipeRow(i, r.inventoryItem?._id || r.inventoryItem, r.amountUsed, inv)).join('');
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="mf-name" value="${item?.name || ''}" placeholder="Margherita Pizza" />
      </div>
      <div class="form-group">
        <label class="form-label">Price ($)</label>
        <input class="form-input" id="mf-price" type="number" step="0.01" value="${item?.price || ''}" placeholder="12.99" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="mf-cat">
          ${['Starter','Main Course','Dessert','Beverage','Side'].map(c => `<option value="${c}" ${item?.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:.1rem">
        <label class="toggle">
          <input type="checkbox" id="mf-avail" ${item?.isAvailable!==false?'checked':''} />
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-label">Available</span>
        </label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="mf-desc" placeholder="Brief description…">${item?.description || ''}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Recipe (Ingredients)</label>
      <div class="recipe-list" id="recipe-list">${recipeRows}</div>
      <button class="btn btn-ghost btn-sm add-ingredient-btn" type="button" onclick="addRecipeRow()">+ Add Ingredient</button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveMenuItem('${item?._id||''}')">
        ${item ? 'Save Changes' : 'Add to Menu'}
      </button>
    </div>`;
}

function recipeRow(idx, invId, amount, inv) {
  const invOpts = (inv || window._invItems || []).map(i =>
    `<option value="${i._id}" ${i._id===invId?'selected':''}>${i.name} (${i.unit})</option>`
  ).join('');
  return `
    <div class="recipe-item" id="recipe-row-${idx}" data-idx="${idx}">
      <select class="form-select form-input" data-role="inv">${invOpts}</select>
      <input class="form-input" type="number" step="0.001" placeholder="Amount" value="${amount||''}" data-role="amt" style="width:90px" />
      <button class="recipe-remove" type="button" onclick="this.closest('.recipe-item').remove()">✕</button>
    </div>`;
}

let _recipeIdx = 100;
function addRecipeRow() {
  const list = document.getElementById('recipe-list');
  const inv = window._invItems || [];
  const div = document.createElement('div');
  div.innerHTML = recipeRow(_recipeIdx++, null, '', inv);
  list.appendChild(div.firstElementChild);
}

async function saveMenuItem(id) {
  const name        = document.getElementById('mf-name').value.trim();
  const price       = parseFloat(document.getElementById('mf-price').value);
  const category    = document.getElementById('mf-cat').value;
  const isAvailable = document.getElementById('mf-avail').checked;
  const description = document.getElementById('mf-desc').value.trim();

  const rows = document.querySelectorAll('.recipe-item');
  const recipe = [];
  for (const row of rows) {
    const invId = row.querySelector('[data-role="inv"]').value;
    const amt   = parseFloat(row.querySelector('[data-role="amt"]').value);
    if (invId && !isNaN(amt) && amt > 0) recipe.push({ inventoryItem: invId, amountUsed: amt });
  }

  if (!name || isNaN(price)) { toast('Name and price are required', 'error'); return; }

  try {
    if (id) {
      await api.updateMenuItem(id, { name, price, category, isAvailable, description, recipe });
      toast('Menu item updated', 'success');
    } else {
      await api.createMenuItem({ name, price, category, isAvailable, description, recipe });
      toast('Menu item added', 'success');
    }
    closeModal(); renderMenu();
  } catch (e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  TABLES
// ═══════════════════════════════════════════════════════════
async function renderTables() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const res = await api.getTables();
    const tables = res.data || [];
    const avail = tables.filter(t => t.status === 'available').length;
    const occ   = tables.filter(t => t.status === 'occupied').length;
    const res2  = tables.filter(t => t.status === 'reserved').length;

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Tables</h1>
          <p><span style="color:var(--green)">${avail} available</span> · <span style="color:var(--red)">${occ} occupied</span> · <span style="color:var(--accent)">${res2} reserved</span></p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openAddTableModal()">+ Add Table</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header"><div class="card-title">🪑 Floor Plan</div></div>
        <div class="card-body">
          ${tables.length
            ? `<div class="tables-visual-grid">${tables.map(t => `
                <div class="table-chip ${t.status}" style="cursor:default">
                  <div class="chip-num">#${t.number}</div>
                  <div class="chip-cap">${t.seatingCapacity} seats</div>
                  <div class="chip-status">${t.status}</div>
                </div>`).join('')}</div>`
            : emptySt('🪑', 'No tables yet')
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">📋 All Tables</div></div>
        <div class="card-body-flush table-wrap">
          <table>
            <thead><tr>
              <th>Table #</th><th>Capacity</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${tables.length
                ? tables.map(t => `
                    <tr>
                      <td><strong>#${t.number}</strong></td>
                      <td>${t.seatingCapacity} seats</td>
                      <td>${statusBadge(t.status)}</td>
                    </tr>`).join('')
                : `<tr><td colspan="3">${emptySt('🪑','No tables')}</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div>${e.message}</div></div>`;
  }
}

function openAddTableModal() {
  openModal('Add Table', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Table Number</label>
        <input class="form-input" id="tbl-num" type="number" min="1" placeholder="1" />
      </div>
      <div class="form-group">
        <label class="form-label">Seating Capacity</label>
        <input class="form-input" id="tbl-cap" type="number" min="1" placeholder="4" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveTable()">Add Table</button>
    </div>`);
}

async function saveTable() {
  const number = parseInt(document.getElementById('tbl-num').value);
  const seatingCapacity = parseInt(document.getElementById('tbl-cap').value);
  if (!number || !seatingCapacity) { toast('Both fields are required', 'error'); return; }
  try {
    await api.createTable({ number, seatingCapacity });
    toast('Table added', 'success'); closeModal(); renderTables();
  } catch (e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════
async function renderOrders() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const [ordersRes, tablesRes, menuRes] = await Promise.all([
      api.getOrders(), api.getTables(), api.getMenu()
    ]);
    const orders = ordersRes.data || [];
    window._tablesCache = tablesRes.data || [];
    window._menuCache   = menuRes.data   || [];

    const active = orders.filter(o => ['pending','preparing','served'].includes(o.status));
    const badge = document.getElementById('badge-orders');
    if (active.length) { badge.textContent = active.length; badge.style.display = ''; }
    else badge.style.display = 'none';

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Orders</h1>
          <p>${orders.length} total · ${active.length} active</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openPlaceOrderModal()">+ Place Order</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🧾 All Orders</div></div>
        <div class="card-body-flush table-wrap">
          <table>
            <thead><tr>
              <th>Table</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${orders.length
                ? orders.map(o => `
                    <tr>
                      <td><strong>Table #${o.table?.number ?? '?'}</strong></td>
                      <td class="td-muted">${(o.items||[]).map(i=>`${i.menuItem?.name||'?'} ×${i.quantity}`).join(', ')}</td>
                      <td class="td-mono">${fmt(o.total)}</td>
                      <td>${statusBadge(o.status)}</td>
                      <td class="td-muted">${fmtDateTime(o.createdAt)}</td>
                      <td>
                        <div class="td-actions">
                          ${orderStatusButtons(o)}
                        </div>
                      </td>
                    </tr>`).join('')
                : `<tr><td colspan="6">${emptySt('🧾','No orders yet')}</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div>${e.message}</div></div>`;
  }
}

function orderStatusButtons(o) {
  const next = { pending:'preparing', preparing:'served', served:'paid' };
  const labels = { preparing:'▶ Preparing', served:'🍽️ Served', paid:'✅ Paid' };
  const html = [];
  if (next[o.status]) {
    html.push(`<button class="btn btn-blue btn-sm" onclick="setOrderStatus('${o._id}','${next[o.status]}')">${labels[next[o.status]]}</button>`);
  }
  if (!['paid','cancelled'].includes(o.status)) {
    html.push(`<button class="btn btn-danger btn-sm" onclick="setOrderStatus('${o._id}','cancelled')">✕ Cancel</button>`);
  }
  return html.join('');
}

async function setOrderStatus(id, status) {
  try {
    await api.updateStatus(id, status);
    toast(`Order marked as ${status}`, 'success');
    renderOrders();
  } catch (e) { toast(e.message, 'error'); }
}

function openPlaceOrderModal() {
  const tables = (window._tablesCache || []).filter(t => t.status === 'available');
  const menu   = (window._menuCache   || []).filter(m => m.isAvailable);
  openModal('Place New Order', `
    <div class="form-group">
      <label class="form-label">Table</label>
      <select class="form-select" id="ord-table">
        <option value="">Select a table…</option>
        ${tables.map(t=>`<option value="${t._id}">Table #${t.number} (${t.seatingCapacity} seats)</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Order Items</label>
      <div id="order-items-list" class="recipe-list"></div>
      <button class="btn btn-ghost btn-sm add-ingredient-btn" onclick="addOrderItem()">+ Add Item</button>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitOrder()">Place Order</button>
    </div>`);
  addOrderItem();
}

let _orderItemIdx = 0;
function addOrderItem() {
  const menu = (window._menuCache || []).filter(m => m.isAvailable);
  const list = document.getElementById('order-items-list');
  if (!list) return;
  const idx = _orderItemIdx++;
  const div = document.createElement('div');
  div.className = 'recipe-item'; div.id = `oi-${idx}`;
  div.innerHTML = `
    <select class="form-select form-input" data-role="mid">
      <option value="">Choose dish…</option>
      ${menu.map(m=>`<option value="${m._id}">${m.name} — ${fmt(m.price)}</option>`).join('')}
    </select>
    <input class="form-input" type="number" min="1" value="1" data-role="qty" style="width:70px" />
    <button class="recipe-remove" onclick="this.closest('.recipe-item').remove()">✕</button>`;
  list.appendChild(div);
}

async function submitOrder() {
  const tableId = document.getElementById('ord-table').value;
  if (!tableId) { toast('Select a table', 'error'); return; }
  const rows = document.querySelectorAll('#order-items-list .recipe-item');
  const items = [];
  for (const row of rows) {
    const menuItemId = row.querySelector('[data-role="mid"]').value;
    const quantity   = parseInt(row.querySelector('[data-role="qty"]').value);
    if (menuItemId && quantity > 0) items.push({ menuItemId, quantity });
  }
  if (!items.length) { toast('Add at least one item', 'error'); return; }
  try {
    await api.placeOrder({ tableId, items });
    toast('Order placed!', 'success'); closeModal(); renderOrders();
  } catch (e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  RESERVATIONS
// ═══════════════════════════════════════════════════════════
async function renderReservations() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const [resRes, tblRes] = await Promise.all([api.getReservations(), api.getTables()]);
    const reservations = resRes.data || [];
    window._tablesCache = tblRes.data || [];
    const confirmed = reservations.filter(r => r.status === 'confirmed');

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Reservations</h1>
          <p>${confirmed.length} upcoming · ${reservations.length} total</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openAddReservationModal()">+ New Reservation</button>
        </div>
      </div>
      ${reservations.length
        ? `<div style="display:flex;flex-direction:column;gap:.65rem">
            ${reservations.map(r => {
              const dt = new Date(r.dateTime);
              return `
                <div class="reservation-item">
                  <div class="res-date">
                    <div class="res-date-day">${dt.getDate()}</div>
                    <div class="res-date-mon">${dt.toLocaleString('en',{month:'short'})}</div>
                    <div class="res-time">${fmtTime(r.dateTime)}</div>
                  </div>
                  <div class="res-info">
                    <div class="res-name">${r.customerName}</div>
                    <div class="res-meta">
                      📞 ${r.customerPhone} · 👥 ${r.partySize} guests · 🪑 Table #${r.table?.number ?? '?'}
                    </div>
                  </div>
                  ${statusBadge(r.status)}
                  <div class="res-actions">
                    ${r.status === 'confirmed'
                      ? `<button class="btn btn-danger btn-sm" onclick="cancelRes('${r._id}')">Cancel</button>`
                      : ''
                    }
                  </div>
                </div>`;
            }).join('')}
           </div>`
        : emptySt('📅', 'No reservations yet')
      }`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div>${e.message}</div></div>`;
  }
}

async function cancelRes(id) {
  if (!confirm('Cancel this reservation and free the table?')) return;
  try {
    await api.cancelReservation(id);
    toast('Reservation cancelled', 'success'); renderReservations();
  } catch (e) { toast(e.message, 'error'); }
}

function openAddReservationModal() {
  const tables = (window._tablesCache || []);
  // Default date/time = now + 1 hour
  const soon = new Date(Date.now() + 3600000);
  const pad = n => String(n).padStart(2,'0');
  const defaultDT = `${soon.getFullYear()}-${pad(soon.getMonth()+1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:00`;

  openModal('New Reservation', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Customer Name</label>
        <input class="form-input" id="res-name" placeholder="John Smith" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" id="res-phone" placeholder="+1 555 0100" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Table</label>
        <select class="form-select" id="res-table">
          <option value="">Select table…</option>
          ${tables.map(t=>`<option value="${t._id}">Table #${t.number} (${t.seatingCapacity} seats)</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Party Size</label>
        <input class="form-input" id="res-size" type="number" min="1" value="2" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Date & Time</label>
      <input class="form-input" id="res-dt" type="datetime-local" value="${defaultDT}" />
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitReservation()">Reserve Table</button>
    </div>`);
}

async function submitReservation() {
  const tableId      = document.getElementById('res-table').value;
  const customerName = document.getElementById('res-name').value.trim();
  const customerPhone= document.getElementById('res-phone').value.trim();
  const partySize    = parseInt(document.getElementById('res-size').value);
  const dateTime     = document.getElementById('res-dt').value;
  if (!tableId || !customerName || !customerPhone || !partySize || !dateTime) {
    toast('All fields are required', 'error'); return;
  }
  try {
    await api.createReservation({ tableId, customerName, customerPhone, partySize, dateTime: new Date(dateTime).toISOString() });
    toast('Reservation confirmed!', 'success'); closeModal(); renderReservations();
  } catch (e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  INVENTORY
// ═══════════════════════════════════════════════════════════
async function renderInventory() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const res = await api.getInventory();
    const items = res.data || [];
    const low = items.filter(i => i.quantity <= i.lowStockThreshold).length;

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Inventory</h1>
          <p>${items.length} stock items · ${low > 0 ? `<span style="color:var(--red)">${low} low stock</span>` : '<span style="color:var(--green)">all healthy</span>'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openAddInventoryModal()">+ Add Item</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📦 Stock Levels</div></div>
        <div class="card-body-flush table-wrap">
          <table>
            <thead><tr>
              <th>Item</th><th>Unit</th><th>Qty on Hand</th><th>Threshold</th><th>Level</th><th>Actions</th>
            </tr></thead>
            <tbody>
              ${items.length
                ? items.map(item => {
                    const pct = Math.min((item.quantity / (item.lowStockThreshold * 2 || 1)) * 100, 100);
                    const cls = pct < 30 ? 'low' : pct < 60 ? 'mid' : 'ok';
                    const isLow = item.quantity <= item.lowStockThreshold;
                    return `
                      <tr>
                        <td><strong>${item.name}</strong>${isLow ? ' <span class="badge badge-occupied" style="font-size:.65rem">LOW</span>' : ''}</td>
                        <td class="td-muted">${item.unit}</td>
                        <td class="td-mono" style="color:${isLow?'var(--red)':'var(--text)'}">${item.quantity}</td>
                        <td class="td-mono td-muted">${item.lowStockThreshold}</td>
                        <td style="min-width:120px">
                          <div style="display:flex;align-items:center;gap:.6rem">
                            <div class="stock-bar-wrap"><div class="stock-bar ${cls}" style="width:${pct}%"></div></div>
                            <span style="font-size:.72rem;color:var(--text3)">${Math.round(pct)}%</span>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-blue btn-sm" onclick="openRestockModal('${item._id}','${item.name}','${item.unit}')">+ Restock</button>
                        </td>
                      </tr>`;
                  }).join('')
                : `<tr><td colspan="6">${emptySt('📦','No inventory items')}</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div>${e.message}</div></div>`;
  }
}

function openAddInventoryModal() {
  openModal('Add Stock Item', `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Item Name</label>
        <input class="form-input" id="inv-name" placeholder="Flour" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <input class="form-input" id="inv-unit" placeholder="grams" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Initial Quantity</label>
        <input class="form-input" id="inv-qty" type="number" min="0" placeholder="1000" />
      </div>
      <div class="form-group">
        <label class="form-label">Low-Stock Threshold</label>
        <input class="form-input" id="inv-threshold" type="number" min="0" placeholder="200" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveInventoryItem()">Add Item</button>
    </div>`);
}

async function saveInventoryItem() {
  const name             = document.getElementById('inv-name').value.trim();
  const unit             = document.getElementById('inv-unit').value.trim();
  const quantity         = parseFloat(document.getElementById('inv-qty').value);
  const lowStockThreshold= parseFloat(document.getElementById('inv-threshold').value);
  if (!name || !unit || isNaN(quantity) || isNaN(lowStockThreshold)) {
    toast('All fields are required', 'error'); return;
  }
  try {
    await api.createInventory({ name, unit, quantity, lowStockThreshold });
    toast('Stock item added', 'success'); closeModal(); renderInventory();
  } catch (e) { toast(e.message, 'error'); }
}

function openRestockModal(id, name, unit) {
  openModal(`Restock — ${name}`, `
    <p style="color:var(--text2);margin-bottom:1.25rem">Enter the quantity to add to the current stock level.</p>
    <div class="form-group">
      <label class="form-label">Amount to Add (${unit})</label>
      <input class="form-input" id="restock-amt" type="number" min="0.001" step="0.001" placeholder="500" />
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="doRestock('${id}')">Add Stock</button>
    </div>`);
}

async function doRestock(id) {
  const amount = parseFloat(document.getElementById('restock-amt').value);
  if (isNaN(amount) || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
  try {
    await api.restock(id, { amount });
    toast('Stock updated!', 'success'); closeModal(); renderInventory();
  } catch (e) { toast(e.message, 'error'); }
}

// ═══════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════
async function renderReports() {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="loading-page"><span class="spinner lg"></span></div>`;

  try {
    const [sales, alerts, orders] = await Promise.all([
      api.getDailySales(), api.getStockAlerts(), api.getOrders()
    ]);

    const orderList = orders.data || [];
    const alertList = alerts.data || [];
    const byStatus = {};
    for (const o of orderList) byStatus[o.status] = (byStatus[o.status]||0)+1;

    // Revenue by day (last 7 days)
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
      const key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      dayMap[key] = 0;
    }
    for (const o of orderList) {
      if (o.status !== 'paid') continue;
      const key = new Date(o.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'});
      if (key in dayMap) dayMap[key] += o.total;
    }
    const maxRev = Math.max(...Object.values(dayMap), 1);

    c.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <h1>Reports</h1>
          <p>Business insights and analytics</p>
        </div>
      </div>

      <div class="stats-grid" style="margin-bottom:1.5rem">
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Today's Revenue</div>
            <div class="stat-value" style="color:var(--accent)">${fmt(sales.data.totalRevenue)}</div>
            <div class="stat-sub">From ${sales.data.orderCount} paid orders</div>
          </div>
          <div class="stat-icon amber">💰</div>
        </div>
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${orderList.length}</div>
            <div class="stat-sub">${byStatus['paid']||0} paid · ${byStatus['cancelled']||0} cancelled</div>
          </div>
          <div class="stat-icon blue">🧾</div>
        </div>
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Avg Order Value</div>
            <div class="stat-value">${orderList.filter(o=>o.status==='paid').length ? fmt(orderList.filter(o=>o.status==='paid').reduce((s,o)=>s+o.total,0)/orderList.filter(o=>o.status==='paid').length) : '$0'}</div>
            <div class="stat-sub">Paid orders only</div>
          </div>
          <div class="stat-icon green">📊</div>
        </div>
        <div class="stat-card">
          <div class="stat-left">
            <div class="stat-label">Stock Alerts</div>
            <div class="stat-value" style="color:${alertList.length?'var(--red)':'var(--green)'}">${alertList.length}</div>
            <div class="stat-sub">Items at or below threshold</div>
          </div>
          <div class="stat-icon red">⚠️</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Revenue chart -->
        <div class="card">
          <div class="card-header"><div class="card-title">📈 Revenue — Last 7 Days</div></div>
          <div class="card-body">
            <div style="display:flex;align-items:flex-end;gap:6px;height:140px;padding-top:1rem">
              ${Object.entries(dayMap).map(([day, rev]) => {
                const h = Math.max((rev/maxRev)*120, rev > 0 ? 6 : 2);
                return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:.3rem">
                  <div style="font-size:.65rem;color:var(--text3)">${rev>0?fmt(rev):''}</div>
                  <div style="width:100%;height:${h}px;background:${rev>0?'linear-gradient(180deg,var(--accent),#d97706)':'var(--surface3)'};border-radius:5px 5px 0 0;transition:height .4s ease"></div>
                  <div style="font-size:.65rem;color:var(--text3);white-space:nowrap">${day}</div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Order status breakdown -->
        <div class="card">
          <div class="card-header"><div class="card-title">🧾 Order Status Breakdown</div></div>
          <div class="card-body">
            ${['pending','preparing','served','paid','cancelled'].map(s => {
              const cnt = byStatus[s]||0;
              const total = orderList.length||1;
              const pct = Math.round((cnt/total)*100);
              return `<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
                ${statusBadge(s)}
                <div class="stock-bar-wrap"><div class="stock-bar ok" style="width:${pct}%;background:var(--blue)"></div></div>
                <span style="font-size:.8rem;color:var(--text2);min-width:40px;text-align:right">${cnt}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:1.25rem">
        <div class="card-header">
          <div class="card-title">⚠️ Low Stock Alert Details</div>
        </div>
        <div class="card-body-flush table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Unit</th><th>Current Qty</th><th>Threshold</th><th>Level</th></tr></thead>
            <tbody>
              ${alertList.length
                ? alertList.map(item => {
                    const pct = Math.min((item.quantity/(item.lowStockThreshold*2||1))*100,100);
                    return `<tr>
                      <td><strong>${item.name}</strong></td>
                      <td class="td-muted">${item.unit}</td>
                      <td class="td-mono" style="color:var(--red)">${item.quantity}</td>
                      <td class="td-mono td-muted">${item.lowStockThreshold}</td>
                      <td><div style="display:flex;align-items:center;gap:.5rem;min-width:100px">
                        <div class="stock-bar-wrap"><div class="stock-bar low" style="width:${pct}%"></div></div>
                        <span style="font-size:.72rem;color:var(--text3)">${Math.round(pct)}%</span>
                      </div></td>
                    </tr>`;
                  }).join('')
                : `<tr><td colspan="5">${emptySt('✅','All stock levels are healthy')}</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (e) {
    c.innerHTML = `<div class="empty-state"><div>${e.message}</div></div>`;
  }
}
