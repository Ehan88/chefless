import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, Tag, Sparkles } from 'lucide-react';

function RewardCard({ reward, userPoints, onRedeem, redeeming }) {
  const canAfford = userPoints >= reward.points_cost;
  const typeIcons = { discount: '🏷️', free_item: '🍽️', perk: '✨' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 border transition-all ${
        canAfford
          ? 'bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
          : 'bg-white/[0.01] border-white/5 opacity-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{typeIcons[reward.type] || '🎁'}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium mb-0.5">{reward.name}</div>
          <div className="text-[10px] text-gray-500 leading-relaxed mb-3">{reward.description}</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Tag size={10} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400">{reward.points_cost} pts</span>
            </div>
            <button
              onClick={() => canAfford && onRedeem(reward.id)}
              disabled={!canAfford || redeeming}
              className={`px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all ${
                canAfford
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              {redeeming ? '...' : canAfford ? 'Redeem' : 'Need more pts'}
            </button>
          </div>
        </div>
      </div>
      {reward.stock >= 0 && (
        <div className="mt-2 text-[9px] text-gray-600 text-right">{reward.stock} left</div>
      )}
    </motion.div>
  );
}

export default function RewardsStore({ rewards, userPoints, myRewards, onRedeem, redeeming }) {
  const [tab, setTab] = useState('catalog');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2">
            <Gift size={14} className="text-green-400" />
            Rewards Store
          </h3>
          <span className="text-xs font-bold">{userPoints} pts available</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/[0.03] rounded-lg overflow-hidden mb-4">
          <button
            onClick={() => setTab('catalog')}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${
              tab === 'catalog' ? 'bg-white/10 text-white' : 'text-gray-600'
            }`}
          >
            <Sparkles size={10} className="inline mr-1" /> Available
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`flex-1 py-2 text-[10px] uppercase tracking-wider transition-colors ${
              tab === 'mine' ? 'bg-white/10 text-white' : 'text-gray-600'
            }`}
          >
            <Check size={10} className="inline mr-1" /> My Rewards
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'catalog' ? (
          <motion.div
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-2"
          >
            {(!rewards || rewards.length === 0) ? (
              <div className="py-8 text-center text-gray-500 text-sm">No rewards available yet.</div>
            ) : (
              rewards.map((r) => (
                <RewardCard
                  key={r.id}
                  reward={r}
                  userPoints={userPoints || 0}
                  onRedeem={onRedeem}
                  redeeming={redeeming}
                />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="mine"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 sm:px-6 pb-5 sm:pb-6"
          >
            {(!myRewards || myRewards.length === 0) ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                <p>No rewards redeemed yet.</p>
                <p className="text-[10px] mt-1">Earn points and redeem them for discounts & perks!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myRewards.map((r) => (
                  <div key={r.id} className="rounded-xl p-3 bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium">{r.reward_name}</div>
                        <div className="text-[10px] text-gray-500">{r.reward_desc}</div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-[9px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">{r.status}</div>
                        <div className="text-[10px] font-mono text-gray-500 mt-1">{r.code}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
