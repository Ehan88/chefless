import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8"
      >
        <img
          src="/chef-logo.png"
          alt="Chefless"
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
        />
      </motion.div>

      {/* Brand name */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-2xl sm:text-3xl font-bold tracking-[0.4em] font-[family-name:var(--font-display)] mb-10"
      >
        CHEFLESS
      </motion.h1>

      {/* Loading bar */}
      <div className="w-48 sm:w-56 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-1/2 h-full bg-white/60 rounded-full"
        />
      </div>
    </motion.div>
  );
}
