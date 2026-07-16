import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';

function AchievementBadge({ achievement, index }) {
  const unlocked = achievement.unlocked;
  const progress = achievement.target > 0 ? Math.min(100, (achievement.progress / achievement.target) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative rounded-xl p-4 text-center transition-all ${
        unlocked
          ? 'bg-white/[0.05] border border-white/10 hover:border-white/20'
          : 'bg-white/[0.02] border border-white/5 opacity-50'
      }`}
    >
      {/* Badge Icon */}
      <div className="text-3xl mb-2">{achievement.icon}</div>

      {/* Name */}
      <div className="text-xs font-semibold mb-1">{achievement.name}</div>

      {/* Description */}
      <div className="text-[10px] text-gray-500 leading-tight">
        {unlocked ? achievement.desc : `Progress: ${achievement.progress}/${achievement.target}`}
      </div>

      {/* Progress bar for locked */}
      {!unlocked && (
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/30 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute top-2 right-2">
          <Lock size={10} className="text-gray-600" />
        </div>
      )}

      {/* Unlocked glow */}
      {unlocked && (
        <div className="absolute inset-0 rounded-xl bg-white/[0.03] pointer-events-none" />
      )}
    </motion.div>
  );
}

export default function Achievements({ data }) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2">
          <Award size={14} className="text-purple-400" />
          Achievements
        </h3>
        <span className="text-[10px] text-gray-500">
          {data.unlocked}/{data.total} unlocked
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(data.unlocked / data.total) * 100}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full bg-gradient-to-r from-purple-500/60 to-blue-500/60 rounded-full"
        />
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {data.achievements.map((a, i) => (
          <AchievementBadge key={a.id} achievement={a} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
