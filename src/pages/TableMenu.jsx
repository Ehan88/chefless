import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, X, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { socket, connectSocket } from '../utils/socket';

const API = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function TableMenu() {
  const { id } = useParams();
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [notes, setNotes] = useState('');

  // Fetch table info + menu
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/tables/number/${id}`).then(r => r.json()),
      fetch(`${API}/api/menu`).then(r => r.json()),
      fetch(`${API}/api/menu/categories`).then(r => r.json()),
    ]).then(([tableData, menuData, catData]) => {
      setTable(tableData);
      setMenu(menuData);
      setCategories(catData);
      setLoading(false);

      // Check for active order
      if (tableData.activeOrder) {
        setActiveOrder(tableData.activeOrder);
      }
    }).catch(() => setLoading(false));
  }, [id]);

  // Socket.IO — listen for order updates
  useEffect(() => {
    connectSocket();
    socket.emit('join:table', Number(id));

    socket.on('order:update', (order) => {
      setActiveOrder(order);
    });

    return () => {
      socket.off('order:update');
    };
  }, [id]);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const filteredMenu = activeCategory === 'all'
    ? menu
    : menu.filter(i => i.category === activeCategory);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: Number(id),
          items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.order);
        setCart([]);
        setNotes('');
        setShowCart(false);
        setActiveOrder(data.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdering(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // ─── Order Success ────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-3">Order Placed!</h1>
          <p className="text-white/60 mb-2">Order #{orderSuccess.id} • Table {id}</p>
          <p className="text-2xl font-bold text-white mb-6">₹{orderSuccess.total}</p>
          <p className="text-white/40 text-sm mb-8">Your food is being prepared. We'll notify you when it's ready.</p>
          <button
            onClick={() => { setOrderSuccess(null); setActiveOrder(orderSuccess); }}
            className="bg-white text-black font-bold py-3 px-8 rounded-lg text-sm tracking-wider"
          >
            BACK TO MENU
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Main Menu View ───────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs tracking-wider uppercase">Tapez</p>
              <h1 className="text-xl font-bold">
                {table ? table.name : `Table ${id}`}
              </h1>
              <p className="text-white/40 text-xs">{table?.seats} seats</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-white text-black p-3 rounded-full"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-all ${
                activeCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Order Banner */}
      {activeOrder && (
        <div className="mx-4 mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium uppercase tracking-wider">
              Order #{activeOrder.id} — {activeOrder.status}
            </span>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="px-4 py-4">
        {filteredMenu.map((item, i) => {
          const inCart = cart.find(c => c.id === item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between py-4 border-b border-white/5"
            >
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  {item.featured ? <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded">★</span> : null}
                </div>
                <p className="text-white/40 text-xs mt-0.5">{item.description}</p>
                <p className="text-white font-bold text-sm mt-1">₹{item.price}</p>
              </div>

              {/* Quantity Controls */}
              {inCart ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{inCart.quantity}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-black" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(item)}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Cart Bottom Bar */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-lg border-t border-white/10"
        >
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-white text-black font-bold py-3.5 rounded-lg flex items-center justify-between px-6"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {cartCount} items
            </span>
            <span>₹{cartTotal} →</span>
          </button>
        </motion.div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Your Order</h2>
                  <button onClick={() => setShowCart(false)} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-white/40 text-xs">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                        <Plus className="w-3 h-3 text-black" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-white/40" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Special Instructions</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="No onions, extra spicy..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Total + Order */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between mb-4">
                    <span className="text-white/60">Total</span>
                    <span className="text-xl font-bold">₹{cartTotal}</span>
                  </div>
                  <button
                    onClick={placeOrder}
                    disabled={ordering || cart.length === 0}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {ordering ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Placing order...</>
                    ) : (
                      <>Place Order • Table {id}</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
