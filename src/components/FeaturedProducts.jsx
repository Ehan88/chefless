import { Plus } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { PRODUCTS } from '../utils/constants';
import { useCart } from '../context/CartContext';

export default function FeaturedProducts() {
  const { addItem } = useCart();

  return (
    <section id="menu" className="py-28 lg:py-36 bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4 block">Our Menu</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Featured Products
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((product, index) => (
            <ScrollReveal key={product.id} delay={index * 0.12}>
              <div className="group glass-card rounded-3xl overflow-hidden h-full flex flex-col hover:border-white/10 transition-all duration-500">
                {/* Image */}
                <div className="relative aspect-[4/3] img-zoom">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="absolute top-4 left-4 text-[10px] tracking-[0.15em] uppercase bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/10">
                    {product.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-[family-name:var(--font-display)]">₹{product.price}</span>
                    <button
                      onClick={() => addItem(product)}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors duration-300 btn-ripple"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
