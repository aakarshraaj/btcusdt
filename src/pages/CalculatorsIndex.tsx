import { motion } from 'motion/react';
import { calculators } from '../config/calculators';

interface CalculatorsIndexProps {
  onCalculatorClick: (slug: string) => void;
  onHomeClick: () => void;
}

export function CalculatorsIndex({ onCalculatorClick, onHomeClick }: CalculatorsIndexProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onHomeClick}
                className="text-2xl font-bold text-foreground hover:text-accent-foreground transition-colors"
              >
                BTC Tracker
              </button>
              <nav className="text-sm text-muted-foreground">
                <button onClick={onHomeClick} className="hover:text-foreground">Home</button>
                <span className="mx-2">›</span>
                <span className="text-foreground">Calculators</span>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Crypto Calculators
          </h1>
          <p className="text-lg text-muted-foreground">
            Essential tools for calculating profits, planning investments, and analyzing returns.
          </p>
        </div>
        
        {/* Calculator grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {calculators.map((calculator, index) => (
            <motion.div
              key={calculator.slug}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCalculatorClick(calculator.slug)}
            >
              <div className="text-4xl mb-4">{calculator.icon}</div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {calculator.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {calculator.description}
              </p>
              <button className="w-full bg-primary text-primary-foreground rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors">
                Use Calculator
              </button>
            </motion.div>
          ))}
        </div>

        {/* Additional content */}
        <div className="mt-16 bg-muted rounded-xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Why Use Our Calculators?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">🎯 Accurate</h3>
              <p className="text-muted-foreground text-sm">
                Precise calculations based on proven financial formulas and real market data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">⚡ Fast</h3>
              <p className="text-muted-foreground text-sm">
                Get instant results without complicated setup or registration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">🔒 Private</h3>
              <p className="text-muted-foreground text-sm">
                All calculations are done locally in your browser. No data is stored or shared.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Designed and built by{' '}
              <a
                href="https://www.linkedin.com/in/aakarshraaj"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted hover:decoration-solid hover:text-foreground transition-colors"
              >
                Aakarsh
              </a>
            </p>
            <p className="mt-2 text-xs">
              Disclaimer: These calculators are for educational purposes only. 
              Always do your own research before making investment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}