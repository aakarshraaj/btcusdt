export interface Calculator {
  title: string;
  slug: string;
  description: string;
  icon: string;
}

export const calculators: Calculator[] = [
  {
    title: "Crypto Profit Calculator",
    slug: "profit",
    description: "Estimate gains/losses from any crypto trade.",
    icon: "📊"
  },
  {
    title: "Dollar Cost Averaging Calculator", 
    slug: "dca",
    description: "Plan recurring investments over time.",
    icon: "📈"
  },
  {
    title: "Staking Rewards Calculator",
    slug: "staking", 
    description: "Estimate returns from staking crypto.",
    icon: "🔒"
  },
  {
    title: "Mining Profitability Calculator",
    slug: "mining",
    description: "Calculate potential mining profits.",
    icon: "⛏️"
  }
];