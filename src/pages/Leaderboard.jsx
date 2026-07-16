import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import ProfileCard from '../components/leaderboard/ProfileCard';
import LeaderboardRankings from '../components/leaderboard/LeaderboardRankings';
import Achievements from '../components/leaderboard/Achievements';
import RewardsStore from '../components/leaderboard/RewardsStore';
import ReferralSection from '../components/leaderboard/ReferralSection';
import {
  fetchLeaderboard, fetchProfile, fetchAchievements,
  fetchRewards, fetchMyRewards, redeemReward,
} from '../utils/api';

export default function Leaderboard() {
  const [phone, setPhone] = useState(localStorage.getItem('chefless_phone') || '');
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Load public data (leaderboard + rewards)
  useEffect(() => {
    Promise.allSettled([fetchLeaderboard(), fetchRewards()])
      .then(([lb, rw]) => {
        if (lb.status === 'fulfilled') setLeaders(lb.value);
        if (rw.status === 'fulfilled') setRewards(rw.value);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load profile when phone is entered
  const loadProfile = useCallback(async (p) => {
    if (!p || p.length < 5) return;
    setProfileLoading(true);
    localStorage.setItem('chefless_phone', p);
    try {
      const [prof, ach, myr] = await Promise.allSettled([
        fetchProfile(p), fetchAchievements(p), fetchMyRewards(p),
      ]);
      if (prof.status === 'fulfilled') setProfile(prof.value);
      if (ach.status === 'fulfilled') setAchievements(ach.value);
      if (myr.status === 'fulfilled') setMyRewards(myr.value);
    } catch {}
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    if (phone.length >= 5) loadProfile(phone);
  }, []);

  const handleRedeem = async (rewardId) => {
    if (!phone) return;
    setRedeeming(true);
    setRedeemMsg('');
    try {
      const res = await redeemReward(phone, rewardId);
      setRedeemMsg(`✅ Redeemed! Code: ${res.redemption.code}`);
      loadProfile(phone); // Refresh points
    } catch (e) {
      setRedeemMsg(`❌ ${e.message}`);
    }
    setRedeeming(false);
    setTimeout(() => setRedeemMsg(''), 4000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'achievements', label: 'Badges' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'refer', label: 'Refer' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-8 sm:pb-12 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Trophy size={36} className="mx-auto mb-3 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-[family-name:var(--font-display)] mb-3">
              Rewards Hub
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
              Earn points, unlock achievements, redeem rewards. The more you order, the more you earn.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 sm:px-6 pb-20">
        {/* Phone Lookup */}
        {!profile && (
          <ScrollReveal>
            <div className="glass-card rounded-2xl p-5 sm:p-6 mb-6">
              <h3 className="text-sm tracking-[0.2em] text-gray-400 uppercase mb-3">Enter Your Phone</h3>
              <form onSubmit={(e) => { e.preventDefault(); loadProfile(phone); }} className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
                <button
                  type="submit"
                  disabled={phone.length < 5 || profileLoading}
                  className="px-5 py-3 bg-white text-black text-xs font-semibold tracking-wider uppercase rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {profileLoading ? '...' : 'Go'}
                  {!profileLoading && <ArrowRight size={14} />}
                </button>
              </form>
            </div>
          </ScrollReveal>
        )}

        {/* Profile Card */}
        {profile && <ProfileCard profile={profile} />}

        {/* Tab Navigation */}
        {profile && (
          <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mt-6 mb-5 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-0 py-2 px-3 rounded-lg text-[10px] sm:text-xs uppercase tracking-wider font-medium transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {profile && activeTab === 'overview' && (
          <div className="space-y-5">
            <LeaderboardRankings leaders={leaders} loading={loading} />
            <ReferralSection profile={profile} />
          </div>
        )}
        {activeTab === 'achievements' && <Achievements data={achievements} />}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <RewardsStore
              rewards={rewards}
              userPoints={profile?.points || 0}
              myRewards={myRewards}
              onRedeem={handleRedeem}
              redeeming={redeeming}
            />
            {redeemMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-xs py-2"
              >
                {redeemMsg}
              </motion.div>
            )}
          </div>
        )}
        {activeTab === 'refer' && <ReferralSection profile={profile} />}

        {/* No profile — show public leaderboard */}
        {!profile && !loading && (
          <div className="space-y-5">
            <LeaderboardRankings leaders={leaders} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
