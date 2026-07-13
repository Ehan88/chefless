import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />

      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop"
          alt="Fresh food"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="inline-block text-xs tracking-[0.3em] text-gray-400 uppercase mb-6 border border-white/10 px-4 py-2 rounded-full">
                Premium Semi-Cooked Meals
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8 font-[family-name:var(--font-display)]"
            >
              HOME-COOKED.
              <br />
              <span className="text-gray-400">WITHOUT THE</span>
              <br />
              COOKING.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-md"
            >
              Premium semi-cooked meals prepared for modern living. Fresh ingredients, minimal effort, maximum flavour.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="#menu"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:bg-gray-200 transition-all duration-300 btn-ripple group"
              >
                Order Now
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-3 px-8 py-4 border border-white/20 text-white text-sm font-semibold tracking-[0.15em] uppercase rounded-full hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                Explore Menu
              </a>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden lg:block relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] img-zoom">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=1000&fit=crop"
                alt="Fresh prepared meal"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-2xl">🍳</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Ready in 5 mins</p>
                <p className="text-xs text-gray-400">Fresh, not frozen</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} className="text-gray-500" />
        </motion.div>
      </motion.div>
    </section>
  );
}
