import { useEffect } from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    const handleScroll = () => {
      const features = document.querySelectorAll('.feature-card');
      
      features.forEach((feature) => {
        const rect = feature.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;
        
        if (isVisible) {
          feature.classList.add('opacity-100', 'translate-y-0');
          feature.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on load
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="noise-bg"></div>
      <main className="relative z-10">
        <Hero />
        <Features />
        <Footer />
      </main>
    </div>
  );
}

export default App;