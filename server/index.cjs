const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ─── Database Setup ───────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'chefless.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT DEFAULT '',
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ─── Seed products (for reference) ───────────────────────────────
const PRODUCTS = [
  { id: 1, name: 'Kerala Porotta', price: 89 },
  { id: 2, name: 'Whole Wheat Chapati', price: 69 },
  { id: 3, name: 'Pulka', price: 79 },
  { id: 4, name: 'Poori', price: 99 },
];

// ─── Routes ──────────────────────────────────────────────────────

// Get all products
app.get('/api/products', (req, res) => {
  res.json(PRODUCTS);
});

// Place an order
app.post('/api/orders', (req, res) => {
  const { customer_name, phone, address, notes, items } = req.body;

  if (!customer_name || !phone || !address || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Calculate total
  let total = 0;
  const enrichedItems = items.map((item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    if (!product) return null;
    const lineTotal = product.price * item.quantity;
    total += lineTotal;
    return { ...product, quantity: item.quantity, lineTotal };
  });

  if (enrichedItems.some((i) => !i)) {
    return res.status(400).json({ error: 'Invalid product in order' });
  }

  const stmt = db.prepare(
    'INSERT INTO orders (customer_name, phone, address, notes, items, total) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    customer_name,
    phone,
    address,
    notes || '',
    JSON.stringify(enrichedItems),
    total
  );

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

  // Log notification
  console.log(`\n🔔 NEW ORDER #${order.id}`);
  console.log(`   Customer: ${order.customer_name}`);
  console.log(`   Phone: ${order.phone}`);
  console.log(`   Total: ₹${order.total}`);
  console.log(`   Items: ${enrichedItems.map((i) => `${i.name} × ${i.quantity}`).join(', ')}`);
  console.log('');

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      items: JSON.parse(order.items),
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    },
  });
});

// Get all orders (admin)
app.get('/api/orders', (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM orders';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const orders = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

  res.json({
    orders: orders.map((o) => ({
      ...o,
      items: JSON.parse(o.items),
    })),
    total,
  });
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json({
    ...order,
    items: JSON.parse(order.items),
  });
});

// Update order status (admin)
app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  console.log(`📦 Order #${order.id} status updated: ${order.status} → ${status}`);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ ...updated, items: JSON.parse(updated.items) });
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE status != 'cancelled'").get().sum;
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE date(created_at) = date('now') AND status != 'cancelled'").get().sum;

  res.json({
    totalOrders,
    todayOrders,
    pendingOrders,
    totalRevenue,
    todayRevenue,
  });
});

// ─── Serve Frontend (Production) ─────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');
const fs = require('fs');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`📁 Serving static from: ${distPath}`);
} else {
  console.log(`⚠️  dist/ not found at ${distPath}`);
}

// SPA fallback — serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found. Run npm run build first.');
  }
});

// ─── Start ───────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\\n🚀 Chefless running on http://localhost:${PORT}`);
  console.log(`🛒 Website:    http://localhost:${PORT}`);
  console.log(`📊 Admin:      http://localhost:${PORT}/admin`);
  console.log('');
});
