const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ─── Database Setup ───────────────────────────────────────
const db = new Database(path.join(__dirname, 'chefless.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT DEFAULT 'Guest',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT 'dine-in',
    table_id INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    mode TEXT DEFAULT 'delivery',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
// Add points column if missing (migration)
try { db.exec('ALTER TABLE orders ADD COLUMN points INTEGER DEFAULT 0'); } catch(e) {}
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    seats INTEGER DEFAULT 4,
    status TEXT DEFAULT 'available',
    current_order_id INTEGER DEFAULT 0,
    ble_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price INTEGER NOT NULL,
    category TEXT DEFAULT 'mains',
    image TEXT DEFAULT '',
    available INTEGER DEFAULT 1,
    featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ─── Seed menu if empty ──────────────────────────────────
const menuCount = db.prepare('SELECT COUNT(*) as c FROM menu_items').get().c;
if (menuCount === 0) {
  const seedMenu = db.prepare(
    'INSERT INTO menu_items (name, description, price, category, featured) VALUES (?, ?, ?, ?, ?)'
  );
  const seedData = [
    ['Kerala Porotta', 'Flaky layered flatbread', 89, 'breads', 1],
    ['Whole Wheat Chapati', 'Healthy whole wheat', 69, 'breads', 0],
    ['Pulka', 'Soft puffed bread', 79, 'breads', 0],
    ['Poori', 'Crispy deep-fried bread', 99, 'breads', 0],
    ['Chicken Biryani', 'Hyderabadi style, 700g', 249, 'rice', 1],
    ['Veg Biryani', 'Garden fresh vegetables', 199, 'rice', 0],
    ['Butter Chicken', 'Creamy tomato curry', 289, 'curry', 1],
    ['Paneer Butter Masala', 'Rich paneer curry', 229, 'curry', 0],
    ['Fish Curry', 'Kerala style coconut fish', 269, 'curry', 0],
    ['Chicken 65', 'Spicy fried chicken', 199, 'starters', 1],
    ['Gobi Manchurian', 'Indo-Chinese classic', 149, 'starters', 0],
    ['Masala Chai', 'Kerala kadak chai', 29, 'drinks', 1],
    ['Filter Coffee', 'Madras filter kaapi', 39, 'drinks', 0],
    ['Lime Soda', 'Fresh lime, sweet or salty', 49, 'drinks', 0],
  ];
  for (const item of seedData) {
    seedMenu.run(...item);
  }
  console.log('🌱 Seeded 14 menu items');
}

// ─── Seed tables if empty ────────────────────────────────
const tableCount = db.prepare('SELECT COUNT(*) as c FROM tables').get().c;
if (tableCount === 0) {
  const seedTable = db.prepare(
    'INSERT INTO tables (number, name, seats) VALUES (?, ?, ?)'
  );
  for (let i = 1; i <= 10; i++) {
    seedTable.run(i, `Table ${i}`, i <= 4 ? 4 : (i <= 8 ? 6 : 8));
  }
  console.log('🪑 Seeded 10 tables');
}

// ─── Helper ──────────────────────────────────────────────
function calcPoints(total) {
  if (total >= 500) return 50;
  if (total >= 300) return 30;
  if (total >= 200) return 20;
  if (total >= 100) return 10;
  if (total >= 50) return 5;
  return 3;
}

function getTier(points) {
  if (points >= 300) return { name: 'Platinum', color: '#E5E4E2', icon: '💎' };
  if (points >= 150) return { name: 'Gold', color: '#FFD700', icon: '🥇' };
  if (points >= 50) return { name: 'Silver', color: '#C0C0C0', icon: '🥈' };
  return { name: 'Bronze', color: '#CD7F32', icon: '🥉' };
}

const STATUS_COLORS = {
  pending: 'yellow',
  confirmed: 'blue',
  preparing: 'orange',
  ready: 'green',
  out_for_delivery: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

// ═══════════════════════════════════════════════════════════
// SOCKET.IO — Real-time updates
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // Kitchen/admin joins kitchen room
  socket.on('join:kitchen', () => {
    socket.join('kitchen');
    console.log(`👨‍🍳 Joined kitchen: ${socket.id}`);
  });

  // Table view joins its room
  socket.on('join:table', (tableId) => {
    socket.join(`table:${tableId}`);
    console.log(`🪑 Joined table ${tableId}: ${socket.id}`);
  });

  // Admin joins admin room
  socket.on('join:admin', () => {
    socket.join('admin');
    console.log(`📊 Joined admin: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════════════════
// API — Menu
// ═══════════════════════════════════════════════════════════

// Get full menu
app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM menu_items WHERE available = 1';
  const params = [];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY featured DESC, name ASC';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

// Get menu categories
app.get('/api/menu/categories', (req, res) => {
  const cats = db.prepare(
    'SELECT DISTINCT category FROM menu_items WHERE available = 1 ORDER BY category'
  ).all();
  res.json(cats.map(c => c.category));
});

// Add menu item (admin)
app.post('/api/menu', (req, res) => {
  const { name, description, price, category, image, featured } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });

  const stmt = db.prepare(
    'INSERT INTO menu_items (name, description, price, category, image, featured) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, description || '', price, category || 'mains', image || '', featured ? 1 : 0);
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Update menu item (admin)
app.patch('/api/menu/:id', (req, res) => {
  const { name, description, price, category, image, available, featured } = req.body;
  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  db.prepare(`
    UPDATE menu_items SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      category = COALESCE(?, category),
      image = COALESCE(?, image),
      available = COALESCE(?, available),
      featured = COALESCE(?, featured)
    WHERE id = ?
  `).run(name, description, price, category, image, available, featured, req.params.id);

  const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete menu item (admin)
app.delete('/api/menu/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════
// API — Tables
// ═══════════════════════════════════════════════════════════

// Get all tables
app.get('/api/tables', (req, res) => {
  const tables = db.prepare('SELECT * FROM tables ORDER BY number').all();
  res.json(tables);
});

// Get single table with active order
app.get('/api/tables/:id', (req, res) => {
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  // Get active order for this table
  const activeOrder = db.prepare(
    "SELECT * FROM orders WHERE table_id = ? AND status NOT IN ('delivered', 'cancelled') ORDER BY id DESC LIMIT 1"
  ).get(table.number);

  res.json({
    ...table,
    activeOrder: activeOrder ? { ...activeOrder, items: JSON.parse(activeOrder.items) } : null,
  });
});

// Get table by number (for BLE/NFC lookup)
app.get('/api/tables/number/:num', (req, res) => {
  const table = db.prepare('SELECT * FROM tables WHERE number = ?').get(req.params.num);
  if (!table) return res.status(404).json({ error: 'Table not found' });
  res.json(table);
});

// Update table status
app.patch('/api/tables/:id', (req, res) => {
  const { status, ble_enabled } = req.body;
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);
  if (!table) return res.status(404).json({ error: 'Table not found' });

  if (status) db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, req.params.id);
  if (ble_enabled !== undefined) db.prepare('UPDATE tables SET ble_enabled = ? WHERE id = ?').run(ble_enabled ? 1 : 0, req.params.id);

  const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);
  io.emit('table:updated', updated);
  res.json(updated);
});

// ═══════════════════════════════════════════════════════════
// API — Orders (upgraded with table support + Socket.IO)
// ═══════════════════════════════════════════════════════════

// Place order (supports both delivery and dine-in)
app.post('/api/orders', (req, res) => {
  const { customer_name, phone, address, notes, items, table_id, mode } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }

  // Calculate total from menu_items DB
  let total = 0;
  const enrichedItems = items.map((item) => {
    const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.id);
    if (!menuItem) return null;
    const lineTotal = menuItem.price * item.quantity;
    total += lineTotal;
    return { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: item.quantity, lineTotal };
  });

  if (enrichedItems.some((i) => !i)) {
    return res.status(400).json({ error: 'Invalid menu item in order' });
  }

  const orderMode = table_id ? 'dine-in' : (mode || 'delivery');
  const orderTableId = table_id || 0;
  const orderPoints = calcPoints(total);

  const stmt = db.prepare(
    'INSERT INTO orders (customer_name, phone, address, table_id, notes, items, total, points, mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    customer_name || 'Guest',
    phone || '',
    address || (table_id ? 'dine-in' : ''),
    orderTableId,
    notes || '',
    JSON.stringify(enrichedItems),
    total,
    orderPoints,
    orderMode
  );

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

  // Update table status if dine-in
  if (orderTableId) {
    db.prepare('UPDATE tables SET status = ?, current_order_id = ? WHERE number = ?')
      .run('occupied', order.id, orderTableId);
    io.emit('table:updated', db.prepare('SELECT * FROM tables WHERE number = ?').get(orderTableId));
  }

  // Emit to all channels
  const orderData = { ...order, items: enrichedItems };
  io.to('kitchen').emit('new:order', orderData);
  io.to('admin').emit('new:order', orderData);
  if (orderTableId) io.to(`table:${orderTableId}`).emit('order:update', orderData);

  console.log(`\n🔔 NEW ORDER #${order.id} (${orderMode})`);
  if (orderTableId) console.log(`   🪑 Table: ${orderTableId}`);
  console.log(`   💰 Total: ₹${order.total}`);
  console.log(`   📦 Items: ${enrichedItems.map(i => `${i.name} ×${i.quantity}`).join(', ')}`);

  res.status(201).json({
    success: true,
    order: orderData,
    points_earned: orderPoints,
  });
});

// Get all orders (admin)
app.get('/api/orders', (req, res) => {
  const { status, mode, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (mode) { query += ' AND mode = ?'; params.push(mode); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const orders = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  res.json({
    orders: orders.map(o => ({ ...o, items: JSON.parse(o.items) })),
    total,
  });
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order, items: JSON.parse(order.items) });
});

// Lookup orders by phone
app.get('/api/orders/lookup/:phone', (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '').slice(-10);
  const orders = db.prepare(
    "SELECT * FROM orders WHERE REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') LIKE ? ORDER BY id DESC LIMIT 5"
  ).all(`%${phone}%`);
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
});

// Update order status (with Socket.IO broadcast)
app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const orderData = { ...updated, items: JSON.parse(updated.items) };

  // Broadcast to all channels
  io.to('kitchen').emit('order:status', orderData);
  io.to('admin').emit('order:status', orderData);
  if (order.table_id) io.to(`table:${order.table_id}`).emit('order:update', orderData);

  // Free table if delivered/cancelled
  if (status === 'delivered' || status === 'cancelled') {
    if (order.table_id) {
      db.prepare('UPDATE tables SET status = ?, current_order_id = 0 WHERE number = ?')
        .run('available', order.table_id);
      io.emit('table:updated', db.prepare('SELECT * FROM tables WHERE number = ?').get(order.table_id));
    }
  }

  console.log(`📦 Order #${order.id}: ${order.status} → ${status}`);
  res.json(orderData);
});

// ═══════════════════════════════════════════════════════════
// API — Leaderboard & Points
// ═══════════════════════════════════════════════════════════

// Leaderboard — top customers by total points
app.get('/api/leaderboard', (req, res) => {
  const leaders = db.prepare(`
    SELECT customer_name, phone, SUM(points) as total_points, COUNT(*) as order_count
    FROM orders
    WHERE phone != '' AND status != 'cancelled'
    GROUP BY phone
    ORDER BY total_points DESC
    LIMIT 20
  `).all();

  res.json(leaders.map((l, i) => ({
    rank: i + 1,
    name: l.customer_name,
    phone: l.phone,
    points: l.total_points,
    orders: l.order_count,
    tier: getTier(l.total_points),
  })));
});

// Customer points lookup by phone
app.get('/api/points/:phone', (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '').slice(-10);
  const result = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total_points, COUNT(*) as order_count
    FROM orders
    WHERE REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') LIKE ?
      AND status != 'cancelled'
  `).get(`%${phone}%`);

  const tier = getTier(result.total_points);
  res.json({
    points: result.total_points,
    orders: result.order_count,
    tier,
  });
});

// ═══════════════════════════════════════════════════════════
// API — Dashboard Stats
// ═══════════════════════════════════════════════════════════

app.get('/api/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const todayOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date('now')").get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE status != 'cancelled'").get().s;
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'").get().s;
  const dineInOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE mode = 'dine-in'").get().c;
  const deliveryOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE mode = 'delivery'").get().c;
  const activeTables = db.prepare("SELECT COUNT(*) as c FROM tables WHERE status = 'occupied'").get().c;

  res.json({
    totalOrders, todayOrders, pendingOrders,
    totalRevenue, todayRevenue,
    dineInOrders, deliveryOrders, activeTables,
  });
});

// ═══════════════════════════════════════════════════════════
// Serve Frontend (Production)
// ═══════════════════════════════════════════════════════════

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found. Run npm run build first.');
  }
});

// ─── Start ───────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Chefless + Tapez running on http://localhost:${PORT}`);
  console.log(`🛒 Website:     http://localhost:${PORT}`);
  console.log(`🪑 Table Mode:  http://localhost:${PORT}/table/1`);
  console.log(`👨‍🍳 Kitchen:     http://localhost:${PORT}/kitchen`);
  console.log(`📊 Admin:       http://localhost:${PORT}/admin`);
  console.log('');
});
