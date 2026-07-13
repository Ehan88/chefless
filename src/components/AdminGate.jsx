import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';

const ADMIN_PASSWORD = 'Chefless2026';

export default function AdminGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => {
    return sessionStorage.getItem('chefless_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate brief delay for UX
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
        <div className="fixed top-0 right-0 z-50 p-4">
          <button
            onClick={() => {
              sessionStorage.removeItem('chefless_admin_auth');
              setAuthenticated(false);
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
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Lock size={28} className="text-gray-400" strokeWidth={1.5} />
          </div>
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
