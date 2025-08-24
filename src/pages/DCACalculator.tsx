import { CalculatorLayout } from '../components/CalculatorLayout';

interface DCACalculatorProps {
  onHomeClick: () => void;
  onCalculatorClick: (slug: string) => void;
}

export function DCACalculator({ onHomeClick, onCalculatorClick }: DCACalculatorProps) {
  return (
    <CalculatorLayout
      title="Dollar Cost Averaging Calculator"
      description="Plan recurring investments over time with our dollar cost averaging calculator. See how DCA can help reduce volatility impact in crypto markets."
      onHomeClick={onHomeClick}
    >
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Coming Soon
        </h2>
        <p className="text-muted-foreground mb-6">
          This dollar cost averaging calculator is currently under development. It will help you plan your recurring crypto investments, calculate average entry prices, and track your DCA strategy performance using BTCUSDT live price data.
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