import { CalculatorLayout } from '../components/CalculatorLayout';

interface StakingCalculatorProps {
  onHomeClick: () => void;
  onCalculatorClick: (slug: string) => void;
}

export function StakingCalculator({ onHomeClick, onCalculatorClick }: StakingCalculatorProps) {
  return (
    <CalculatorLayout
      title="Staking Rewards Calculator"
      description="Estimate potential returns from staking your cryptocurrency assets."
      onHomeClick={onHomeClick}
    >
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Coming Soon
        </h2>
        <p className="text-muted-foreground mb-6">
          This calculator is currently under development. It will help you estimate staking rewards.
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