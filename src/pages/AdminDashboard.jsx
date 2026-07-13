import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrders, fetchStats, updateOrderStatus } from '../utils/api';
import { Bell, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  out_for_delivery: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

// Simple notification beep using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* silent fail */ }
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const prevCountRef = useRef(0);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetchOrders(filter ? { status: filter } : {}),
        fetchStats(),
      ]);

      const newOrders = ordersRes.orders;
      const prevCount = prevCountRef.current;

      // Detect new orders
      if (prevCount > 0 && newOrders.length > prevCount) {
        const newestIds = new Set();
        for (let i = 0; i < newOrders.length - prevCount; i++) {
          newestIds.add(newOrders[i].id);
        }
        setNewOrderIds((prev) => new Set([...prev, ...newestIds]));
        playNotificationSound();

        // Clear highlight after 10s
        setTimeout(() => {
          setNewOrderIds((prev) => {
            const next = new Set(prev);
            newestIds.forEach((id) => next.delete(id));
            return next;
          });
        }, 10000);
      }

      prevCountRef.current = newOrders.length;
      setLastOrderCount(newOrders.length);
      setOrders(newOrders);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Live order management · Auto-refreshes every 10s</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Bell size={14} className="text-yellow-400 animate-pulse" />
                <span className="text-xs text-yellow-400 font-medium">{pendingCount} pending</span>
              </div>
            )}
            <button
              onClick={loadData}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Refresh now"
            >
              <RefreshCw size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Today's Orders" value={stats.todayOrders} />
            <StatCard
              label="Pending"
              value={stats.pendingOrders}
              highlight={stats.pendingOrders > 0}
              pulse={stats.pendingOrders > 0}
            />
            <StatCard label="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString()}`} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['', 'pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs tracking-wide border transition-colors ${
                filter === s
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
              }`}
            >
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No orders yet. Waiting for customers...</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`glass-card rounded-2xl p-5 transition-all duration-500 ${
                  newOrderIds.has(order.id)
                    ? 'border-green-500/40 shadow-lg shadow-green-500/5'
                    : 'hover:border-white/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold">#{order.id}</span>
                      <span className={`text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {newOrderIds.has(order.id) && (
                        <span className="text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.phone} · {order.address}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {order.items.map((i) => `${i.name} × ${i.quantity}`).join(' + ')}
                    </p>
                    {order.notes && <p className="text-xs text-gray-600 mt-1 italic">"{order.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-4 md:text-right">
                    <div>
                      <p className="text-lg font-bold font-[family-name:var(--font-display)]">₹{order.total}</p>
                      <p className="text-[10px] text-gray-600">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, NEXT_STATUS[order.status])}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                          → {STATUS_LABELS[NEXT_STATUS[order.status]]}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-full text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, pulse }) {
  return (
    <div className={`glass-card rounded-2xl p-5 transition-all ${highlight ? 'border-yellow-500/20' : ''}`}>
      <p className="text-xs text-gray-500 tracking-wide uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold font-[family-name:var(--font-display)] flex items-center gap-2">
        {value}
        {pulse && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
      </p>
    </div>
  );
}
