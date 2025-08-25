/**
 * DISABLED: Mock price data generator 
 * This file is kept for reference but mock data is disabled per requirements.
 * The application should never fall back to mock data and should stay in loading
 * state forever if Binance connection fails.
 */

export interface MockPriceData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
}

// Base prices for cryptocurrencies (realistic as of late 2024)
const BASE_PRICES = {
  BTC: 65432.10,
  ETH: 3456.78,
  SOL: 206.45
} as const;

// Price volatility ranges (as percentage of base price)
const VOLATILITY = {
  BTC: 0.002, // 0.2% typical movement
  ETH: 0.003, // 0.3% typical movement  
  SOL: 0.005  // 0.5% typical movement
} as const;

export class MockPriceProvider {
  private prices: Record<string, number> = { ...BASE_PRICES };
  private volumes: Record<string, number> = {
    BTC: 28456.789,
    ETH: 156432.123,
    SOL: 89234.567
  };
  private changes: Record<string, number> = {
    BTC: 0.85,
    ETH: -1.23,
    SOL: 2.45
  };
  
  private listeners: Map<string, (data: MockPriceData) => void> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Generate realistic price fluctuation
   */
  private generatePriceMovement(symbol: keyof typeof BASE_PRICES): number {
    const basePrice = this.prices[symbol];
    const volatility = VOLATILITY[symbol];
    
    // Generate random movement with slight upward bias (bull market simulation)
    const randomChange = (Math.random() - 0.48) * volatility * basePrice;
    const newPrice = basePrice + randomChange;
    
    // Ensure price stays within reasonable bounds (±20% of base)
    const minPrice = BASE_PRICES[symbol] * 0.8;
    const maxPrice = BASE_PRICES[symbol] * 1.2;
    
    return Math.max(minPrice, Math.min(maxPrice, newPrice));
  }

  /**
   * Start providing mock data for a cryptocurrency
   * DISABLED: No mock data should be used per requirements
   */
  subscribe(symbol: string, callback: (data: MockPriceData) => void): void {
    console.warn(`🚫 Mock data is disabled. Application should not fall back to mock data for ${symbol}`);
    // Do nothing - mock data is disabled
    return;
  }

  /**
   * Stop providing data for a cryptocurrency
   */
  unsubscribe(symbol: string): void {
    console.log(`🎭 Stopping mock data for ${symbol}`);
    
    if (this.intervals.has(symbol)) {
      clearInterval(this.intervals.get(symbol));
      this.intervals.delete(symbol);
    }
    
    this.listeners.delete(symbol);
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const mockPriceProvider = new MockPriceProvider();