import { ArrowRight, Trophy } from 'lucide-react';
import { useState } from 'react';
import { fetchCustomerPoints } from '../utils/api';
import ScrollReveal from './ScrollReveal';

export default function FinalCTA() {
  const [phone, setPhone] = useState('');
  const [myPoints, setMyPoints] = useState(null);
  const [looking, setLooking] = useState(false);

  const checkPoints = async (e) => {
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
    <>
      {/* Points Widget */}
      <section className="py-16 sm:py-20 bg-black border-t border-white/5">
        <div className="max-w-xl mx-auto px-5 sm:px-6 text-center">
          <ScrollReveal>
            <Trophy size={28} className="mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl sm:text-2xl font-bold mb-2 font-[family-name:var(--font-display)]">Earn Points Every Order</h3>
            <p className="text-sm text-gray-500 mb-6">Check your loyalty status or view the full leaderboard.</p>

            {!myPoints ? (
              <form onSubmit={checkPoints} className="flex gap-3 max-w-sm mx-auto">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                />
                <button
                  type="submit"
                  disabled={looking || !phone.trim()}
                  className="px-5 py-3 bg-white text-black text-xs font-semibold tracking-wider uppercase rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {looking ? '...' : 'Check'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-6 mb-4">
                <div>
                  <div className="text-3xl font-bold font-[family-name:var(--font-display)]">{myPoints.points}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Points</div>
                </div>
                <div className="text-2xl">{myPoints.tier.icon}</div>
                <div>
                  <div className="text-lg font-semibold" style={{ color: myPoints.tier.color }}>{myPoints.tier.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{myPoints.orders} orders</div>
                </div>
              </div>
            )}

            <a href="/leaderboard" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mt-3 uppercase tracking-wider">
              View Full Leaderboard <ArrowRight size={12} />
            </a>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 lg:py-40 bg-black relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-white/[0.02] rounded-full blur-[100px] sm:blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-12 text-center relative z-10">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tight mb-6 sm:mb-8 font-[family-name:var(--font-display)] leading-[0.95]">
            Bring Homemade
            <br />
            Back.
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
            Fresh, semi-cooked meals delivered to your door. Home-cooked taste without the time commitment.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="#menu"
            className="inline-flex items-center gap-2 sm:gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-black text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-gray-200 transition-all duration-300 btn-ripple group"
          >
            Start Your Order
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </ScrollReveal>
      </div>
    </section>
    </>
  );
}
