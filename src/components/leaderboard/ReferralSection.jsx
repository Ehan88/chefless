import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Check, Users, TrendingUp, ArrowRight, Gift } from 'lucide-react';
import { applyReferral } from '../../utils/api';

export default function ReferralSection({ profile }) {
  const [copied, setCopied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applyMsg, setApplyMsg] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  if (!profile) return null;

  const copyCode = () => {
    if (profile.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    setApplyLoading(true);
    setApplyMsg('');
    try {
      const res = await applyReferral(localStorage.getItem('chefless_phone') || '', applyCode);
      setApplyMsg(res.message || 'Referral applied!');
      setApplyCode('');
    } catch (e) {
      setApplyMsg(e.message || 'Failed to apply');
    }
    setApplyLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="space-y-4"
    >
      {/* Referral Card */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2 mb-4">
          <Users size={14} className="text-blue-400" />
          Refer Friends
        </h3>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-400 mb-3">
            Share your code with friends. You both earn <span className="text-white font-bold">20 bonus points</span> when they place their first order!
          </p>

          {/* Referral Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-center">
              <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-[0.15em]">
                {profile.referralCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="text-[10px] font-semibold uppercase">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <TrendingUp size={12} />
            {profile.referralCount || 0} friend{(profile.referralCount || 0) !== 1 ? 's' : ''} referred
          </span>
          <span className="flex items-center gap-1">
            +{(profile.referralCount || 0) * 20} bonus pts earned
          </span>
        </div>

        {/* Apply Code */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            onClick={() => setShowApply(!showApply)}
            className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            Have a referral code? <ArrowRight size={10} />
          </button>
          <AnimatePresence>
            {showApply && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-3">
                  <input
                    value={applyCode}
                    onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. CHEF1234)"
                    className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 uppercase tracking-wider"
                  />
                  <button
                    onClick={handleApply}
                    disabled={applyLoading || !applyCode.trim()}
                    className="px-4 py-2 bg-white text-black text-[10px] font-semibold uppercase rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {applyLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {applyMsg && (
                  <p className="text-[10px] text-green-400 mt-2">{applyMsg}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* How Points Work */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2 mb-4">
          <Gift size={14} className="text-yellow-400" />
          How Points Work
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {[
            { range: '₹0 – ₹49', pts: 3 },
            { range: '₹50 – ₹99', pts: 5 },
            { range: '₹100 – ₹199', pts: 10 },
            { range: '₹200 – ₹299', pts: 20 },
            { range: '₹300 – ₹499', pts: 30 },
            { range: '₹500+', pts: 50 },
          ].map((r) => (
            <div key={r.range} className="bg-white/[0.03] rounded-lg p-2.5 text-center">
              <div className="text-[10px] text-gray-500">{r.range}</div>
              <div className="text-sm font-bold mt-0.5">+{r.pts}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-[10px] text-gray-500">
          <span>🥉 Bronze: 0+</span>
          <span>🥈 Silver: 50+</span>
          <span>🥇 Gold: 150+</span>
          <span>💎 Platinum: 300+</span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 text-center text-[10px] text-gray-600">
          <p>🔥 Order daily to build streaks · 👥 Refer friends for +20 pts each</p>
        </div>
      </div>
    </motion.div>
  );
}
