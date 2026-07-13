import { Leaf, Clock, Heart } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { FEATURES } from '../utils/constants';

const iconMap = {
  leaf: Leaf,
  clock: Clock,
  heart: Heart,
};

export default function WhatIsChefless() {
  return (
    <section id="about" className="py-28 lg:py-36 bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4 block">The Concept</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              What is Chefless?
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon];
            return (
              <ScrollReveal key={feature.title} delay={index * 0.15}>
                <div className="glass-card rounded-3xl p-8 lg:p-10 h-full group hover:border-white/10 transition-all duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors duration-500">
                    <Icon size={24} className="text-gray-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-wide">{feature.title}</h3>
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
