import { ReactNode } from 'react';
import { MiniTicker } from './MiniTicker';

interface CalculatorLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  onHomeClick: () => void;
}

export function CalculatorLayout({ title, description, children, onHomeClick }: CalculatorLayoutProps) {
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
                <span>Calculators</span>
                <span className="mx-2">›</span>
                <span className="text-foreground">{title}</span>
              </nav>
            </div>
            <MiniTicker onTickerClick={onHomeClick} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {description}
          </p>
        </div>
        
        {children}
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