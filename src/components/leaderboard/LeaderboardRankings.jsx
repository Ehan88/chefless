import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Search, Star, TrendingUp } from 'lucide-react';

function PodiumSpot({ user, place, height }) {
  if (!user) return (
    <div className="flex flex-col items-center justify-end opacity-30">
      <div className="text-2xl mb-2">—</div>
      <div className="w-16 h-24 sm:w-20 sm:h-32 bg-white/[0.03] rounded-t-xl" />
    </div>
  );

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const heights = { 1: 'h-32 sm:h-40', 2: 'h-24 sm:h-32', 3: 'h-20 sm:h-28' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: place * 0.15 }}
      className="flex flex-col items-center justify-end"
    >
      {/* Name */}
      <div className="text-center mb-2">
        <div className="text-xl mb-1">{medals[place]}</div>
        <div className="text-xs font-medium truncate max-w-[80px]">{user.name}</div>
        <div className="text-[10px] text-gray-500">{user.points} pts</div>
      </div>
      {/* Bar */}
      <div className={`w-16 sm:w-20 ${heights[place]} bg-gradient-to-t from-white/10 to-white/[0.03] rounded-t-xl border border-white/10 flex items-center justify-center`}>
        <span className="text-2xl font-bold font-[family-name:var(--font-display)] text-white/20">#{place}</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardRankings({ leaders, loading, searchPhone }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = leaders.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      if (!l.name?.toLowerCase().includes(q) && !l.phone?.includes(q)) return false;
    }
    if (filter === 'gold') return l.points >= 150;
    if (filter === 'silver') return l.points >= 50 && l.points < 150;
    if (filter === 'bronze') return l.points < 50;
    return true;
  });

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header + Search */}
      <div className="p-5 sm:p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2">
            <Star size={14} className="text-yellow-400" />
            Rankings
          </h3>
          <span className="text-[10px] text-gray-600">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full pl-8 pr-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
            />
          </div>
          <div className="flex bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden">
            {['all', 'gold', 'silver', 'bronze'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  filter === f ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {f === 'all' ? 'All' : f === 'gold' ? '🥇' : f === 'silver' ? '🥈' : '🥉'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm">Loading rankings...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No rankings yet.</p>
          <a href="/#menu" className="inline-block mt-4 px-5 py-2 bg-white text-black text-[10px] font-semibold tracking-wider uppercase rounded-full hover:bg-gray-200 transition-colors">
            Order Now
          </a>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 sm:gap-4 py-6 px-4">
              <PodiumSpot user={top3[1]} place={2} />
              <PodiumSpot user={top3[0]} place={1} />
              <PodiumSpot user={top3[2]} place={3} />
            </div>
          )}

          {/* Rest of list */}
          {rest.length > 0 && (
            <div className="divide-y divide-white/5">
              {rest.map((l, i) => (
                <motion.div
                  key={l.phone}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-5 sm:px-6 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-xs text-gray-600 w-6 text-center font-mono">{l.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.name}</div>
                    <div className="text-[10px] text-gray-500">{l.orders} order{l.orders !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-[family-name:var(--font-display)]">{l.points}</div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: l.tier?.color }}>
                      {l.tier?.icon} {l.tier?.name}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
