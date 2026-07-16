import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Search, TrendingUp, Star } from 'lucide-react';
import { fetchLeaderboard, fetchCustomerPoints } from '../utils/api';
import ScrollReveal from '../components/ScrollReveal';

const POINTS_TABLE = [
  { range: '₹0 – ₹49', points: 3 },
  { range: '₹50 – ₹99', points: 5 },
  { range: '₹100 – ₹199', points: 10 },
  { range: '₹200 – ₹299', points: 20 },
  { range: '₹300 – ₹499', points: 30 },
  { range: '₹500+', points: 50 },
];

function RankBadge({ rank }) {
  if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={20} className="text-gray-300" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-sm text-gray-500 w-5 text-center">{rank}</span>;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [myPoints, setMyPoints] = useState(null);
  const [looking, setLooking] = useState(false);

  useEffect(() => {
    fetchLeaderboard()
      .then(setLeaders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lookupPoints = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLooking(true);
    try {
      const data = await fetchCustomerPoints(phone);
      setMyPoints(data);
    } catch {
      setMyPoints({ points: 0, orders: 0, tier: { name: 'Bronze', color: '#CD7F32', icon: '🥉' } });
    }
    setLooking(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-12 sm:pb-16 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy size={40} className="mx-auto mb-4 text-yellow-400" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)] mb-4">
              Leaderboard
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
              Earn points with every order. The more you order, the higher you climb.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 sm:px-6 pb-20">
        {/* Points Lookup */}
        <ScrollReveal>
          <div className="glass-card rounded-2xl p-6 sm:p-8 mb-10">
            <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase mb-4">Check Your Points</h3>
            <form onSubmit={lookupPoints} className="flex gap-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setMyPoints(null); }}
                placeholder="Enter phone number"
                className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
              />
              <button
                type="submit"
                disabled={looking || !phone.trim()}
                className="px-6 py-3 bg-white text-black text-sm font-semibold tracking-wider uppercase rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Search size={16} />
                {looking ? '...' : 'Check'}
              </button>
            </form>

            {myPoints && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col sm:flex-row items-center gap-6"
              >
                <div className="text-center">
                  <div className="text-4xl font-bold font-[family-name:var(--font-display)]">{myPoints.points}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Total Points</div>
                </div>
                <div className="h-px sm:h-12 w-12 sm:w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl">{myPoints.tier.icon}</div>
                  <div className="text-sm mt-1" style={{ color: myPoints.tier.color }}>{myPoints.tier.name}</div>
                </div>
                <div className="h-px sm:h-12 w-12 sm:w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold font-[family-name:var(--font-display)]">{myPoints.orders}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Orders</div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollReveal>

        {/* Points Table */}
        <ScrollReveal delay={0.1}>
          <div className="glass-card rounded-2xl p-6 sm:p-8 mb-10">
            <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase mb-4 flex items-center gap-2">
              <TrendingUp size={14} />
              How Points Work
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POINTS_TABLE.map((row) => (
                <div key={row.range} className="bg-white/[0.03] rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500">{row.range}</div>
                  <div className="text-lg font-bold mt-1">+{row.points} pts</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <span>🥉 Bronze: 0+</span>
              <span>🥈 Silver: 50+</span>
              <span>🥇 Gold: 150+</span>
              <span>💎 Platinum: 300+</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Leaderboard */}
        <ScrollReveal delay={0.2}>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-8 pb-0">
              <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2">
                <Star size={14} />
                Top Customers
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading leaderboard...</div>
            ) : leaders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                <p>No orders yet. Be the first to earn points!</p>
                <a href="/#menu" className="inline-block mt-4 px-6 py-2 bg-white text-black text-xs font-semibold tracking-wider uppercase rounded-full hover:bg-gray-200 transition-colors">
                  Order Now
                </a>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {leaders.map((l, i) => (
                  <motion.div
                    key={l.phone}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 px-6 sm:px-8 py-4 ${
                      i < 3 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <RankBadge rank={l.rank} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{l.name}</div>
                      <div className="text-xs text-gray-500">{l.orders} order{l.orders !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold font-[family-name:var(--font-display)]">{l.points}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: l.tier.color }}>
                        {l.tier.icon} {l.tier.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
