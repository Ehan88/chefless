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


db.exec(\`
  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    points_cost INTEGER NOT NULL,
    type TEXT DEFAULT 'discount',
    value INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    stock INTEGER DEFAULT -1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
\`);

db.exec(\`
  CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    reward_id INTEGER NOT NULL,
    points_spent INTEGER NOT NULL,
    code TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
  )
\`);

db.exec(\`
  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_phone TEXT NOT NULL,
    referee_phone TEXT NOT NULL UNIQUE,
    bonus_points INTEGER DEFAULT 20,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
\`);

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

// ─── Seed rewards if empty ──────────────────────────────
const rewardCount = db.prepare('SELECT COUNT(*) as c FROM rewards').get().c;
if (rewardCount === 0) {
  const seedReward = db.prepare(
    'INSERT INTO rewards (name, description, points_cost, type, value, active) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const rewardData = [
    ['10% Off Next Order', 'Get 10% off on your next order (up to ₹50)', 30, 'discount', 10, 1],
    ['Free Masala Chai', 'Complimentary Masala Chai with your next order', 25, 'free_item', 29, 1],
    ['Free Lime Soda', 'Fresh lime soda on the house', 30, 'free_item', 49, 1],
    ['₹50 Off', 'Flat ₹50 off on orders above ₹200', 75, 'discount', 50, 1],
    ['Free Gobi Manchurian', 'Complimentary starter with any order', 60, 'free_item', 149, 1],
    ['Free Chicken 65', 'Spicy fried chicken on us!', 100, 'free_item', 199, 1],
    ['₹100 Off', 'Flat ₹100 off on orders above ₹300', 120, 'discount', 100, 1],
    ['Free Kerala Porotta (4pc)', 'Four flaky porottas, free!', 80, 'free_item', 356, 1],
    ['VIP Early Access', 'Get menu items 30 min before launch', 200, 'perk', 0, 1],
    ['Birthday Special', 'Free meal on your birthday (up to ₹300)', 250, 'perk', 300, 1],
  ];
  for (const r of rewardData) {
    seedReward.run(...r);
  }
  console.log('🎁 Seeded 10 rewards');
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


// ─── Streak & Achievements Helpers ────────────────────
function getStreak(phone) {
  const orders = db.prepare(`
    SELECT date(created_at) as order_date
    FROM orders
    WHERE phone LIKE ? AND status != 'cancelled'
    ORDER BY created_at DESC
    LIMIT 60
  `).all(`%${phone}%`);

  if (orders.length === 0) return { current: 0, best: 0, lastOrder: null };

  const dates = [...new Set(orders.map(o => o.order_date))].sort().reverse();
  let currentStreak = 0;
  let bestStreak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      const diff = (new Date(today) - new Date(dates[0])) / (1000 * 60 * 60 * 24);
      if (diff > 1) break;
      currentStreak = 1;
    } else {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        currentStreak++;
      } else {
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        currentStreak = 1;
      }
    }
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;

  return { current: currentStreak, best: bestStreak, lastOrder: dates[0] || null };
}

function getAchievements(phone) {
  const r = db.prepare(`
    SELECT COUNT(*) as order_count, COALESCE(SUM(points), 0) as total_points,
           COALESCE(SUM(total), 0) as total_spent
    FROM orders WHERE phone LIKE ? AND status != 'cancelled'
  `).get(`%${phone}%`);

  const streak = getStreak(phone);
  const refCount = db.prepare('SELECT COUNT(*) as c FROM referrals WHERE referrer_phone LIKE ?')
    .get(`%${phone}%`).c;

  const a = [];
  // Order milestones
  a.push({ id: 'first_order', name: 'First Bite', desc: 'Placed your first order', icon: '🍽️', unlocked: r.order_count >= 1, progress: r.order_count, target: 1 });
  a.push({ id: 'five_orders', name: 'Regular', desc: '5 orders completed', icon: '🔥', unlocked: r.order_count >= 5, progress: r.order_count, target: 5 });
  a.push({ id: 'ten_orders', name: 'Loyalist', desc: '10 orders completed', icon: '💪', unlocked: r.order_count >= 10, progress: r.order_count, target: 10 });
  a.push({ id: 'twentyfive', name: 'Legend', desc: '25 orders completed', icon: '🏆', unlocked: r.order_count >= 25, progress: r.order_count, target: 25 });
  a.push({ id: 'fifty', name: 'Royalty', desc: '50 orders completed', icon: '👑', unlocked: r.order_count >= 50, progress: r.order_count, target: 50 });
  // Spending
  a.push({ id: 'spent_500', name: 'Big Spender', desc: 'Spent ₹500+', icon: '💰', unlocked: r.total_spent >= 500, progress: r.total_spent, target: 500 });
  a.push({ id: 'spent_2k', name: 'Foodie Elite', desc: 'Spent ₹2,000+', icon: '💎', unlocked: r.total_spent >= 2000, progress: r.total_spent, target: 2000 });
  // Streak
  a.push({ id: 'streak_3', name: 'On a Roll', desc: '3-day streak', icon: '⚡', unlocked: streak.best >= 3, progress: streak.best, target: 3 });
  a.push({ id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', icon: '🌟', unlocked: streak.best >= 7, progress: streak.best, target: 7 });
  // Tier
  const tier = getTier(r.total_points);
  a.push({ id: 'gold', name: 'Gold Member', desc: 'Reached Gold tier', icon: '🥇', unlocked: r.total_points >= 150, progress: r.total_points, target: 150 });
  a.push({ id: 'platinum', name: 'Platinum Elite', desc: 'Reached Platinum tier', icon: '💠', unlocked: r.total_points >= 300, progress: r.total_points, target: 300 });
  // Referrals
  a.push({ id: 'first_ref', name: 'Social Butterfly', desc: 'Referred 1 friend', icon: '🦋', unlocked: refCount >= 1, progress: refCount, target: 1 });
  a.push({ id: 'five_ref', name: 'Ambassador', desc: 'Referred 5 friends', icon: '🤝', unlocked: refCount >= 5, progress: refCount, target: 5 });
  return a;
}

function getReferralCode(phone) {
  const clean = phone.replace(/\D/g, '').slice(-10);
  return 'CHEF' + clean.slice(-4).toUpperCase();
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
// API — Leaderboard, Points, Rewards, Profile, Achievements
// ═══════════════════════════════════════════════════════════

// Leaderboard — top customers by total points (with search)
app.get('/api/leaderboard', (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT customer_name, phone, SUM(points) as total_points, COUNT(*) as order_count
    FROM orders WHERE phone != '' AND status != 'cancelled'
  `;
  const params = [];
  if (search) {
    query += ` AND (customer_name LIKE ? OR phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ` GROUP BY phone ORDER BY total_points DESC LIMIT 50`;
  const leaders = db.prepare(query).all(...params);
  res.json(leaders.map((l, i) => ({
    rank: i + 1, name: l.customer_name, phone: l.phone,
    points: l.total_points, orders: l.order_count, tier: getTier(l.total_points),
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
  res.json({ points: result.total_points, orders: result.order_count, tier });
});

// ─── Enhanced Profile ─────────────────────────────────
app.get('/api/profile/:phone', (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '').slice(-10);
  const r = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as total_points, COUNT(*) as order_count,
           COALESCE(SUM(total), 0) as total_spent, MIN(created_at) as member_since
    FROM orders
    WHERE REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') LIKE ?
      AND status != 'cancelled'
  `).get(`%${phone}%`);

  const tier = getTier(r.total_points);
  const streak = getStreak(phone);
  const tiers = [
    { name: 'Bronze', min: 0, icon: '🥉', color: '#CD7F32' },
    { name: 'Silver', min: 50, icon: '🥈', color: '#C0C0C0' },
    { name: 'Gold', min: 150, icon: '🥇', color: '#FFD700' },
    { name: 'Platinum', min: 300, icon: '💎', color: '#E5E4E2' },
  ];
  const currentTierIdx = tiers.findIndex(t => t.name === tier.name);
  const nextTier = currentTierIdx < tiers.length - 1 ? tiers[currentTierIdx + 1] : null;
  const pointsToNext = nextTier ? Math.max(0, nextTier.min - r.total_points) : 0;
  const progress = nextTier && nextTier.min > 0 ? Math.min(100, (r.total_points / nextTier.min) * 100) : 100;

  const favItem = db.prepare(`
    SELECT json_extract(value, '$.name') as name, COUNT(*) as cnt
    FROM orders, json_each(orders.items)
    WHERE phone LIKE ? AND status != 'cancelled'
    GROUP BY name ORDER BY cnt DESC LIMIT 1
  `).get(`%${phone}%`);

  const referralCode = getReferralCode(phone);
  const referralCount = db.prepare('SELECT COUNT(*) as c FROM referrals WHERE referrer_phone LIKE ?')
    .get(`%${phone}%`).c;

  const recentOrders = db.prepare(`
    SELECT id, total, points, status, created_at FROM orders
    WHERE phone LIKE ? AND status != 'cancelled' ORDER BY created_at DESC LIMIT 5
  `).all(`%${phone}%`);

  const rankResult = db.prepare(`
    SELECT COUNT(*) + 1 as rank FROM (
      SELECT phone, SUM(points) as tp FROM orders WHERE phone != '' AND status != 'cancelled'
      GROUP BY phone HAVING tp > ?
    )
  `).get(r.total_points);

  res.json({
    points: r.total_points, orders: r.order_count, totalSpent: r.total_spent,
    tier, streak, favoriteItem: favItem ? favItem.name : null,
    memberSince: r.member_since,
    nextTier: nextTier && r.total_points < nextTier.min ? nextTier : null,
    pointsToNext, progress, referralCode, referralCount, recentOrders, rank: rankResult.rank,
  });
});

// ─── Achievements ─────────────────────────────────────
app.get('/api/achievements/:phone', (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '').slice(-10);
  const achievements = getAchievements(phone);
  const unlocked = achievements.filter(a => a.unlocked).length;
  res.json({ achievements, unlocked, total: achievements.length });
});

// ─── Rewards Catalog ──────────────────────────────────
app.get('/api/rewards', (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards WHERE active = 1 ORDER BY points_cost ASC').all();
  res.json(rewards);
});

// ─── Redeem Reward ────────────────────────────────────
app.post('/api/redeem', (req, res) => {
  const { phone, reward_id } = req.body;
  if (!phone || !reward_id) return res.status(400).json({ error: 'Phone and reward_id required' });
  const phoneClean = phone.replace(/\D/g, '').slice(-10);
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND active = 1').get(reward_id);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  if (reward.stock === 0) return res.status(400).json({ error: 'Out of stock' });

  const r = db.prepare(`
    SELECT COALESCE(SUM(points), 0) as tp FROM orders
    WHERE REPLACE(REPLACE(REPLACE(phone, '+', ''), '-', ''), ' ', '') LIKE ?
      AND status != 'cancelled'
  `).get(`%${phoneClean}%`);
  const used = db.prepare(`SELECT COALESCE(SUM(points_spent), 0) as u FROM redemptions WHERE phone LIKE ? AND status = 'active'`)
    .get(`%${phoneClean}%`).u;
  const available = r.tp - used;
  if (available < reward.points_cost) return res.status(400).json({ error: `Need ${reward.points_cost - available} more points` });

  const code = 'CHF-' + Date.now().toString(36).toUpperCase();
  db.prepare('INSERT INTO redemptions (phone, reward_id, points_spent, code) VALUES (?, ?, ?, ?)')
    .run(phoneClean, reward_id, reward.points_cost, code);
  if (reward.stock > 0) db.prepare('UPDATE rewards SET stock = stock - 1 WHERE id = ?').run(reward_id);

  res.json({ success: true, redemption: { code, reward: reward.name, points_spent: reward.points_cost, description: reward.description } });
});

// ─── My Redemptions ───────────────────────────────────
app.get('/api/my-rewards/:phone', (req, res) => {
  const phone = req.params.phone.replace(/\D/g, '').slice(-10);
  const redemptions = db.prepare(`
    SELECT r.*, rw.name as reward_name, rw.description as reward_desc, rw.type as reward_type
    FROM redemptions r JOIN rewards rw ON r.reward_id = rw.id
    WHERE r.phone LIKE ? ORDER BY r.created_at DESC
  `).all(`%${phone}%`);
  res.json(redemptions);
});

// ─── Referral Apply ───────────────────────────────────
app.post('/api/referral/apply', (req, res) => {
  const { phone, referral_code } = req.body;
  if (!phone || !referral_code) return res.status(400).json({ error: 'Phone and code required' });
  const phoneClean = phone.replace(/\D/g, '').slice(-10);
  const code = referral_code.trim().toUpperCase();
  const suffix = code.replace('CHEF', '');
  const referrer = db.prepare(`SELECT DISTINCT phone FROM orders WHERE phone LIKE ? AND phone != '' LIMIT 1`).get(`%${suffix}%`);
  if (!referrer) return res.status(404).json({ error: 'Invalid referral code' });
  if (referrer.phone.replace(/\D/g, '').slice(-10) === phoneClean) return res.status(400).json({ error: "Can't refer yourself" });
  const existing = db.prepare('SELECT id FROM referrals WHERE referee_phone LIKE ?').get(`%${phoneClean}%`);
  if (existing) return res.status(400).json({ error: 'Already used a referral code' });
  db.prepare('INSERT INTO referrals (referrer_phone, referee_phone, bonus_points) VALUES (?, ?, 20)').run(referrer.phone, phoneClean);
  res.json({ success: true, message: 'Referral applied! +20 bonus points for you and your friend.' });
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