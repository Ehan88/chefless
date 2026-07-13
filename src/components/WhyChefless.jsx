import { Sun, Shield, Zap, Award } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { WHY_FEATURES } from '../utils/constants';

const iconMap = {
  sun: Sun,
  shield: Shield,
  zap: Zap,
  award: Award,
};

export default function WhyChefless() {
  return (
    <section id="why-chefless" className="py-28 lg:py-36 bg-gray-subtle">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4 block">The Difference</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Why Chefless
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <ScrollReveal key={feature.title} delay={index * 0.12}>
                <div className="glass-card rounded-3xl p-8 h-full group hover:border-white/10 transition-all duration-500 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-white/10 transition-colors duration-500">
                    <Icon size={26} className="text-gray-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 tracking-wide">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{feature.description}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
