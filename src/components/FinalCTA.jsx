import { ArrowRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function FinalCTA() {
  return (
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
  );
}
