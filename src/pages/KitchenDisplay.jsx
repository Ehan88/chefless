import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, CheckCircle2, Bell, Volume2 } from 'lucide-react';
import { socket, connectSocket } from '../utils/socket';

const API = import.meta.env.PROD ? '' : 'http://localhost:3001';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready'];
const STATUS_LABELS = {
  pending: 'NEW',
  confirmed: 'CONFIRMED',
  preparing: 'COOKING',
  ready: 'READY',
  delivered: 'DONE',
};
const STATUS_COLORS = {
  pending: 'border-red-500 bg-red-500/5',
  confirmed: 'border-blue-500 bg-blue-500/5',
  preparing: 'border-orange-500 bg-orange-500/5',
  ready: 'border-green-500 bg-green-500/5',
};
const STATUS_TEXT_COLORS = {
  pending: 'text-red-400',
  confirmed: 'text-blue-400',
  preparing: 'text-orange-400',
  ready: 'text-green-400',
};

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current orders
    fetch(`${API}/api/orders?limit=50`)
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders.filter(o => !['delivered', 'cancelled'].includes(o.status)));
        setLoading(false);
      });

    // Connect socket
    connectSocket();
    socket.emit('join:kitchen');

    socket.on('new:order', (order) => {
      playBeep();
      setOrders(prev => [order, ...prev]);
    });

    socket.on('order:status', (order) => {
      if (['delivered', 'cancelled'].includes(order.status)) {
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      }
    });

    return () => {
      socket.off('new:order');
      socket.off('order:status');
    };
  }, []);

  const advanceStatus = async (orderId, currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[idx + 1];

    await fetch(`${API}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
  };

  const getTimeSince = (createdAt) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <ChefHat className="w-10 h-10 text-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-lg border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6" />
            <div>
              <h1 className="text-lg font-bold tracking-wider">KITCHEN DISPLAY</h1>
              <p className="text-white/40 text-xs">{orders.length} active orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${orders.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-xs text-white/40 uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {orders.map(order => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`border-2 rounded-xl p-4 ${STATUS_COLORS[order.status] || 'border-white/10'}`}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl font-black">#{order.id}</span>
                  {order.table_id > 0 && (
                    <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded">
                      🪑 Table {order.table_id}
                    </span>
                  )}
                  {order.mode === 'delivery' && (
                    <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      📦 Delivery
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-white/40">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{getTimeSince(order.created_at)}</span>
                </div>
              </div>

              {/* Status */}
              <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${STATUS_TEXT_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </div>

              {/* Items */}
              <div className="space-y-1.5 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-white/80">{item.name}</span>
                    <span className="font-mono text-white/60">×{item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="text-xs text-yellow-400/80 bg-yellow-400/5 rounded-lg p-2 mb-3">
                  📝 {order.notes}
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center mb-3 pt-2 border-t border-white/10">
                <span className="text-white/40 text-xs">Total</span>
                <span className="font-bold">₹{order.total}</span>
              </div>

              {/* Action Button */}
              {order.status !== 'ready' && (
                <button
                  onClick={() => advanceStatus(order.id, order.status)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {order.status === 'pending' && '✓ Confirm'}
                  {order.status === 'confirmed' && '🔥 Start Cooking'}
                  {order.status === 'preparing' && '✅ Mark Ready'}
                </button>
              )}
              {order.status === 'ready' && (
                <div className="w-full py-2.5 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-bold uppercase tracking-wider text-green-400 text-center">
                  ✓ Ready to Serve
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="col-span-full text-center py-20">
            <ChefHat className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No active orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
