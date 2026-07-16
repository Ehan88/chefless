const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  : (import.meta.env.VITE_API_URL || 'https://chefless.onrender.com');

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function placeOrder(orderData) {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to place order');
  }
  return res.json();
}

export async function fetchOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/orders?${query}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchOrder(id) {
  const res = await fetch(`${API_BASE}/api/orders/${id}`);
  if (!res.ok) throw new Error('Order not found');
  return res.json();
}

export async function lookupOrdersByPhone(phone) {
  const res = await fetch(`${API_BASE}/api/orders/lookup/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error('Lookup failed');
  return res.json();
}

// ─── Leaderboard & Rewards ──────────────────────────

export async function fetchLeaderboard(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`${API_BASE}/api/leaderboard${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchCustomerPoints(phone) {
  const res = await fetch(`${API_BASE}/api/points/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error('Failed to fetch points');
  return res.json();
}

export async function fetchProfile(phone) {
  const res = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function fetchAchievements(phone) {
  const res = await fetch(`${API_BASE}/api/achievements/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error('Failed to fetch achievements');
  return res.json();
}

export async function fetchRewards() {
  const res = await fetch(`${API_BASE}/api/rewards`);
  if (!res.ok) throw new Error('Failed to fetch rewards');
  return res.json();
}

export async function redeemReward(phone, rewardId) {
  const res = await fetch(`${API_BASE}/api/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, reward_id: rewardId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to redeem');
  return data;
}

export async function fetchMyRewards(phone) {
  const res = await fetch(`${API_BASE}/api/my-rewards/${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error('Failed to fetch rewards');
  return res.json();
}

export async function applyReferral(phone, code) {
  const res = await fetch(`${API_BASE}/api/referral/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, referral_code: code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to apply referral');
  return data;
}
