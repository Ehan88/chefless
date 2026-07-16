import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import CartButton from './components/CartButton';
import Hero from './components/Hero';
import WhatIsChefless from './components/WhatIsChefless';
import HowItWorks from './components/HowItWorks';
import FeaturedProducts from './components/FeaturedProducts';
import WhyChefless from './components/WhyChefless';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminGate from './components/AdminGate';
import TableMenu from './pages/TableMenu';
import KitchenDisplay from './pages/KitchenDisplay';

function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <WhatIsChefless />
      <HowItWorks />
      <FeaturedProducts />
      <WhyChefless />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
      <CartDrawer />
      <CartButton />
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <CartProvider>
        <div className="bg-black text-white min-h-screen">
          <AnimatePresence mode="wait">
            {loading && <LoadingScreen key="loader" />}
          </AnimatePresence>

          <Routes>
            {/* Main Website */}
            <Route path="/" element={<HomePage />} />

            {/* Checkout & Tracking */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/track/:id" element={<OrderTracking />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
            {/* Tapez: Table Menu (NFC/BLE target) */}
            <Route path="/table/:id" element={<TableMenu />} />

            {/* Tapez: Kitchen Display */}
            <Route path="/kitchen" element={<KitchenDisplay />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
          </Routes>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
