import { CalculatorLayout } from '../components/CalculatorLayout';

interface MiningCalculatorProps {
  onHomeClick: () => void;
  onCalculatorClick: (slug: string) => void;
}

export function MiningCalculator({ onHomeClick, onCalculatorClick }: MiningCalculatorProps) {
  return (
    <CalculatorLayout
      title="Mining Profitability Calculator"
      description="Calculate potential profits from cryptocurrency mining operations with our mining calculator. Compatible with NiceHash and all mining hardware."
      onHomeClick={onHomeClick}
    >
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <div className="text-6xl mb-4">⛏️</div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Coming Soon
        </h2>
        <p className="text-muted-foreground mb-6">
          This mining calculator is currently under development. It will help you calculate mining profitability, hashrate returns, and electricity costs for Bitcoin and other cryptocurrencies. Compatible with NiceHash and other mining pools.
        </p>
        <button
          onClick={() => onCalculatorClick('profit')}
          className="bg-primary text-primary-foreground rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors"
        >
          Try Profit Calculator Instead
        </button>
      </div>
    </CalculatorLayout>
  );
}