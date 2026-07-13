import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle2, ChefHat, Truck, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchOrder, lookupOrdersByPhone } from '../utils/api';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <XCircle className="w-8 h-8 text-red-400" />
        <span className="text-red-400 font-semibold text-lg tracking-wide uppercase">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center justify-between w-full py-4">
      {STATUS_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {i > 0 && (
              <div className={`absolute top-4 right-1/2 w-full h-0.5 ${isCompleted ? 'bg-white' : 'bg-white/10'}`} />
            )}
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
              isCurrent ? 'bg-white text-black scale-110 shadow-lg shadow-white/20' :
              isCompleted ? 'bg-white/20 text-white' : 'bg-white/5 text-white/20'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] mt-2 text-center tracking-wider uppercase font-medium ${
              isCompleted ? 'text-white' : 'text-white/20'
            }`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold font-[family-name:var(--font-display)]">
            Order #{order.id}
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">{order.created_at}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${
          order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
          order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <StatusTimeline status={order.status} />

      <div className="mt-4 border-t border-white/5 pt-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span className="text-gray-400">{item.name} × {item.quantity}</span>
            <span className="text-white">₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-white/5">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <span>{order.address}</span>
      </div>
    </motion.div>
  );
}

export default function OrderTracking() {
  const [mode, setMode] = useState('id'); // 'id' or 'phone'
  const [input, setInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      if (mode === 'id') {
        const order = await fetchOrder(input.trim());
        setOrders([order]);
      } else {
        const results = await lookupOrdersByPhone(input.trim());
        setOrders(results);
      }
    } catch {
      setError(mode === 'id' ? 'Order not found. Check your order ID.' : 'No orders found for this phone number.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-white transition-colors mb-6 inline-block tracking-widest uppercase">
            ← Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] mb-3">
            Track Your Order
          </h1>
          <p className="text-gray-400 text-lg">
            Enter your order ID or phone number to check the status.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8"
        >
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setMode('id'); setInput(''); setOrders([]); setError(''); setSearched(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all ${
                mode === 'id' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Order ID
            </button>
            <button
              type="button"
              onClick={() => { setMode('phone'); setInput(''); setOrders([]); setError(''); setSearched(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all ${
                mode === 'phone' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Phone Number
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type={mode === 'phone' ? 'tel' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'id' ? 'e.g. 1' : 'e.g. 9876543210'}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold tracking-wider uppercase text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </motion.form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-center mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>

        {/* Empty state */}
        {searched && !loading && orders.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500"
          >
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No orders found.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
