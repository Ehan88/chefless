import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartButton() {
  const { totalItems, setIsOpen } = useCart();

  return (
    <motion.button
      onClick={() => setIsOpen(true)}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg shadow-white/10 hover:bg-gray-200 transition-colors btn-ripple"
      aria-label="Open cart"
    >
      <ShoppingBag size={22} />
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
