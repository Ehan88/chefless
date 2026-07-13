import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, ShoppingBag, Banknote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../utils/api';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const result = await placeOrder({
        ...form,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      });
      clearCart();
      setSuccess(result.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-4 font-[family-name:var(--font-display)]">Order Confirmed!</h1>
          <p className="text-gray-400 mb-2">Order #{success.id}</p>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            "We've received your order. You'll pay ₹{success.total} cash when it arrives. We'll prepare your fresh meals and get them to you soon."
          </p>

          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span>{success.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone</span>
                <span>{success.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="font-semibold">₹{success.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="capitalize">{success.status}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/track/${success.id}`)}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-black text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-gray-200 transition-colors"
            >
              Track Order
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 text-white text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-white/10 transition-colors border border-white/10"
            >
              Back to Home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <ShoppingBag size={48} strokeWidth={1} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mb-6">Add some meals before checking out.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-gray-200 transition-colors"
          >
            Browse Menu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          Back to menu
        </button>

        <h1 className="text-3xl md:text-4xl font-bold mb-2 font-[family-name:var(--font-display)]">Checkout</h1>
        <p className="text-gray-400 text-sm mb-10">Complete your order details below.</p>

        {/* Order Summary */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold tracking-[0.1em] uppercase text-gray-400 mb-4">Order Summary</h2>
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <Banknote size={16} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium tracking-wide">Cash on Delivery — Pay when your order arrives</span>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {item.name} <span className="text-gray-500">× {item.quantity}</span>
                </span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-4 pt-4 flex justify-between">
            <span className="text-sm text-gray-400">Total</span>
            <span className="text-lg font-bold font-[family-name:var(--font-display)]">₹{totalPrice}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-[0.1em] uppercase text-gray-400 mb-2">Full Name *</label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
              placeholder="Your name"
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs tracking-[0.1em] uppercase text-gray-400 mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs tracking-[0.1em] uppercase text-gray-400 mb-2">Delivery Address *</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Full delivery address with landmarks"
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs tracking-[0.1em] uppercase text-gray-400 mb-2">Notes (optional)</label>
            <input
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Special instructions, delivery time preference..."
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-gray-200 transition-colors btn-ripple flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Placing Order...
              </>
            ) : (
              'Place Order — Cash on Delivery'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
