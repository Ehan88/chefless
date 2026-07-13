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
import AdminDashboard from './pages/AdminDashboard';
import AdminGate from './components/AdminGate';

function HomePage() {
  return (
    <>
      <Hero />
      <WhatIsChefless />
      <HowItWorks />
      <FeaturedProducts />
      <WhyChefless />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 1.8s minimum, or until fonts/images load
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
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <HomePage />
                  <CartDrawer />
                  <CartButton />
                </>
              }
            />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/track/:id" element={<OrderTracking />} />
            <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
          </Routes>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
