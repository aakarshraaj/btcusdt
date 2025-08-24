import { useState } from 'react';
import { motion } from 'motion/react';
import { CalculatorLayout } from '../components/CalculatorLayout';

interface ProfitCalculatorProps {
  onHomeClick: () => void;
  onCalculatorClick: (slug: string) => void;
}

interface Results {
  profitUSD: number;
  profitPercentage: number;
  totalBuy: number;
  totalSell: number;
  coins: number;
}

export function ProfitCalculator({ onHomeClick, onCalculatorClick }: ProfitCalculatorProps) {
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [investmentType, setInvestmentType] = useState<'usd' | 'coins'>('usd');
  const [fees, setFees] = useState<string>('0.1');
  const [feeMode, setFeeMode] = useState<'sell' | 'buy' | 'both'>('sell');
  const [results, setResults] = useState<Results | null>(null);

  const calculateProfit = () => {
    const buy = parseFloat(buyPrice);
    const sell = parseFloat(sellPrice);
    const amount = parseFloat(investmentAmount);
    const feePercent = parseFloat(fees || '0') / 100;

    if (!buy || !sell || !amount || buy <= 0 || sell <= 0 || amount <= 0) {
      return;
    }

    let coins: number;
    let totalBuy: number;
    let totalSell: number;

    if (investmentType === 'usd') {
      // User entered amount in USD
      coins = amount / buy;
      totalBuy = amount;
      totalSell = coins * sell;
    } else {
      // User entered number of coins
      coins = amount;
      totalBuy = coins * buy;
      totalSell = coins * sell;
    }

    // Calculate fees based on selected mode
    let totalFees = 0;
    if (feeMode === 'sell') {
      totalFees = totalSell * feePercent;
    } else if (feeMode === 'buy') {
      totalFees = totalBuy * feePercent;
    } else if (feeMode === 'both') {
      totalFees = (totalBuy + totalSell) * feePercent;
    }

    const profitUSD = totalSell - totalBuy - totalFees;
    const profitPercentage = (profitUSD / totalBuy) * 100;

    setResults({
      profitUSD,
      profitPercentage,
      totalBuy,
      totalSell,
      coins
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    });
  };

  return (
    <CalculatorLayout
      title="Crypto Profit Calculator"
      description="Estimate how much profit or loss you made on a crypto trade. Enter your buy price, sell price, and investment amount."
      onHomeClick={onHomeClick}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Trade Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Buy Price (USD)
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="Enter buy price..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sell Price (USD)
              </label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Enter sell price..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Investment Type
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setInvestmentType('usd')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    investmentType === 'usd'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  USD Amount
                </button>
                <button
                  onClick={() => setInvestmentType('coins')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    investmentType === 'coins'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Coin Quantity
                </button>
              </div>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder={investmentType === 'usd' ? 'Enter USD amount...' : 'Enter coin quantity...'}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fees (%) <span className="text-muted-foreground">Optional</span>
              </label>
              <input
                type="number"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="0.1"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Apply Fees To
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fee-sell"
                    name="feeMode"
                    value="sell"
                    checked={feeMode === 'sell'}
                    onChange={(e) => setFeeMode(e.target.value as 'sell' | 'buy' | 'both')}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="fee-sell" className="ml-2 text-sm text-foreground">
                    Sell Only (default)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fee-buy"
                    name="feeMode"
                    value="buy"
                    checked={feeMode === 'buy'}
                    onChange={(e) => setFeeMode(e.target.value as 'sell' | 'buy' | 'both')}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="fee-buy" className="ml-2 text-sm text-foreground">
                    Buy Only
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fee-both"
                    name="feeMode"
                    value="both"
                    checked={feeMode === 'both'}
                    onChange={(e) => setFeeMode(e.target.value as 'sell' | 'buy' | 'both')}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="fee-both" className="ml-2 text-sm text-foreground">
                    Both Buy & Sell
                  </label>
                </div>
              </div>
            </div>

            <motion.button
              onClick={calculateProfit}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 px-4 font-medium hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Calculate Profit
            </motion.button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Results
          </h2>
          
          {results ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className={`text-3xl font-bold ${results.profitUSD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {results.profitUSD >= 0 ? '+' : ''}{formatCurrency(results.profitUSD)}
                </div>
                <div className={`text-lg ${results.profitPercentage >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {results.profitPercentage >= 0 ? '+' : ''}{results.profitPercentage.toFixed(2)}%
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coins:</span>
                  <span className="text-foreground font-medium">{formatCrypto(results.coins)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Buy Value:</span>
                  <span className="text-foreground font-medium">{formatCurrency(results.totalBuy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sell Value:</span>
                  <span className="text-foreground font-medium">{formatCurrency(results.totalSell)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Profit/Loss:</span>
                    <span className={`font-bold ${results.profitUSD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {results.profitUSD >= 0 ? '+' : ''}{formatCurrency(results.profitUSD)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <div className="text-4xl mb-4">📊</div>
              <p>Enter your trade details to calculate profit/loss</p>
            </div>
          )}
        </div>
      </div>

      {/* Related calculators CTA */}
      <div className="mt-12 bg-muted rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Want to plan your investments?
        </h3>
        <p className="text-muted-foreground mb-4">
          Try our Dollar Cost Averaging Calculator to plan recurring investments over time.
        </p>
        <button
          onClick={() => onCalculatorClick('dca')}
          className="bg-primary text-primary-foreground rounded-lg py-2 px-4 hover:bg-primary/90 transition-colors"
        >
          Dollar Cost Averaging Calculator
        </button>
      </div>
    </CalculatorLayout>
  );
}