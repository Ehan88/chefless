import ScrollReveal from './ScrollReveal';
import { STEPS } from '../utils/constants';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 lg:py-36 bg-gray-subtle">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4 block">Simple Process</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              How It Works
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[4.5rem] left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.2}>
              <div className="text-center relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-white/10 bg-black mb-8 relative z-10">
                  <span className="text-2xl font-bold font-[family-name:var(--font-display)] text-gray-300">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 tracking-wide">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm max-w-xs mx-auto">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
