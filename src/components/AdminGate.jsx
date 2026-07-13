import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';

const ADMIN_PASSWORD = 'Chefless2026';

function AdminLoader() {
  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <img src="/chef-logo.png" alt="" className="w-16 h-16 object-contain" />
      </motion.div>
      <p className="text-sm text-gray-500 tracking-[0.2em] uppercase">Loading Dashboard</p>
      <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden mt-4">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1/2 h-full bg-white/50 rounded-full"
        />
      </div>
    </div>
  );
}

export default function AdminGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('chefless_admin_auth') === 'true';
  });
  const [dashboardReady, setDashboardReady] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Brief loading after auth to let dashboard data fetch
  useEffect(() => {
    if (authenticated && !dashboardReady) {
      const timer = setTimeout(() => setDashboardReady(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [authenticated, dashboardReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('chefless_admin_auth', 'true');
        setAuthenticated(true);
      } else {
        setError('Incorrect password');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  };

  if (authenticated) {
    return (
      <div>
        <AnimatePresence>
          {!dashboardReady && <AdminLoader key="admin-loader" />}
        </AnimatePresence>

        <div className="fixed top-0 right-0 z-50 p-4">
          <button
            onClick={() => {
              sessionStorage.removeItem('chefless_admin_auth');
              setAuthenticated(false);
              setDashboardReady(false);
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-full border border-white/5 hover:border-white/10"
          >
            Lock
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <img src="/chef-logo.png" alt="" className="w-14 h-14 object-contain mx-auto mb-5" />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] mb-2">Admin Access</h1>
          <p className="text-sm text-gray-500">Enter password to view the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Password"
            autoFocus
            className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors text-center tracking-widest"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs text-center"
            >
              {error}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 bg-white text-black text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-gray-200 transition-colors btn-ripple flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Enter Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            ← Back to website
          </a>
        </div>
      </motion.div>
    </div>
  );
}
