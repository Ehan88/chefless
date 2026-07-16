import { motion } from 'framer-motion';
import { Crown, TrendingUp, Flame, ShoppingCart, Star, IndianRupee } from 'lucide-react';

const tierColors = {
  Bronze: { bg: 'from-amber-900/30 to-amber-950/20', border: 'border-amber-700/30', text: 'text-amber-500', glow: 'shadow-amber-900/20' },
  Silver: { bg: 'from-gray-300/10 to-gray-400/5', border: 'border-gray-400/30', text: 'text-gray-300', glow: 'shadow-gray-400/20' },
  Gold: { bg: 'from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  Platinum: { bg: 'from-purple-300/10 to-blue-400/5', border: 'border-purple-300/30', text: 'text-purple-300', glow: 'shadow-purple-400/20' },
};

export default function ProfileCard({ profile }) {
  if (!profile) return null;
  const tc = tierColors[profile.tier?.name] || tierColors.Bronze;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-card rounded-2xl overflow-hidden border ${tc.border} shadow-lg ${tc.glow}`}
    >
      {/* Tier Hero */}
      <div className={`bg-gradient-to-br ${tc.bg} p-6 sm:p-8`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Your Rank</p>
            <div className="flex items-center gap-2 mt-1">
              <Crown size={20} className={tc.text} />
              <span className={`text-3xl font-bold font-[family-name:var(--font-display)] ${tc.text}`}>
                #{profile.rank || '—'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl mb-1">{profile.tier?.icon}</div>
            <div className={`text-sm font-semibold ${tc.text}`}>{profile.tier?.name}</div>
          </div>
        </div>

        {/* Points & Progress */}
        <div className="mb-4">
          <div className="flex items-end gap-2 mb-2">
            <span className="text-5xl font-bold font-[family-name:var(--font-display)]">{profile.points}</span>
            <span className="text-sm text-gray-500 mb-1">points</span>
          </div>
          {profile.nextTier && (
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{profile.tier?.name}</span>
                <span>{profile.nextTier.name} ({profile.pointsToNext} to go)</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-white/60 rounded-full"
                />
              </div>
            </div>
          )}
          {!profile.nextTier && (
            <p className="text-[10px] text-gray-500">You've reached the highest tier!</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
        <StatItem icon={<ShoppingCart size={14} />} label="Orders" value={profile.orders} />
        <StatItem icon={<IndianRupee size={14} />} label="Spent" value={`₹${(profile.totalSpent || 0).toLocaleString()}`} />
        <StatItem icon={<Flame size={14} />} label="Streak" value={`${profile.streak?.current || 0}d`} />
        <StatItem icon={<Star size={14} />} label="Fav" value={profile.favoriteItem || '—'} small />
      </div>

      {/* Referral Banner */}
      {profile.referralCode && (
        <div className="px-6 sm:px-8 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={12} className="text-green-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              {profile.referralCount || 0} referral{(profile.referralCount || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-[10px] text-gray-500">Member since {profile.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</span>
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ icon, label, value, small }) {
  return (
    <div className="px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`font-bold font-[family-name:var(--font-display)] ${small ? 'text-xs' : 'text-sm'} truncate`}>{value}</div>
    </div>
  );
}
