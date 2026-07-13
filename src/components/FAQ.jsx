import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { FAQS } from '../utils/constants';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-28 lg:py-36 bg-gray-subtle">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4 block">FAQ</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Common Questions
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 0.08}>
              <div className="glass-card rounded-2xl overflow-hidden hover:border-white/10 transition-colors duration-300">
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className="text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="px-6 pb-6 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
