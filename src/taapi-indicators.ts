/**
 * TAAPI Indicator Groups and Configuration
 * 
 * Provides pre-configured indicator groups for different analysis types
 * and helper functions for indicator management
 */

import { z } from "zod";

// Indicator group definitions
export const INDICATOR_GROUPS = {
  // Minimal: Fast analysis with core indicators
  minimal: ["rsi", "macd"],

  // Standard: Current setup - balanced analysis
  standard: ["rsi", "macd", "sma", "ema", "bbands", "atr"],

  // Comprehensive: Full technical analysis
  comprehensive: [
    // Trend indicators
    "ma",
    "ema",
    "hma",
    "macd",
    "adx",
    "ichimoku",
    // Momentum indicators
    "rsi",
    "stochastic",
    "kdj",
    "cci",
    "roc",
    // Volatility indicators
    "bbands",
    "atr",
    "keltner",
    // Volume indicators
    "obv",
    "mfi",
    // Pattern recognition
    "doji",
    "engulfing",
    "hammer",
  ],

  // Perpetuals-focused: For futures trading analysis
  perpetuals: [
    // Core indicators
    "rsi",
    "macd",
    "bbands",
    "atr",
    // Trend confirmation
    "adx",
    "obv",
    // Support/resistance
    "ichimoku",
  ],

  // Volatility-focused: For range-bound markets
  volatility: ["bbands", "atr", "keltner", "donchian", "rvi"],

  // Trend-focused: For trending markets
  trend: ["macd", "adx", "ichimoku", "linear_regression", "hma"],

  // Momentum-focused: For breakout trading
  momentum: ["rsi", "stochastic", "kdj", "cci", "roc", "obv"],
};

// Supported exchanges
export const SUPPORTED_EXCHANGES = {
  spot: ["binance", "coinbase", "kraken", "bitstamp", "whitebit"],
  futures: ["binancefutures", "bybit"],
  all: [
    "binance",
    "binancefutures",
    "bybit",
    "gate.io",
    "coinbase",
    "kraken",
    "bitstamp",
    "whitebit",
  ],
};

// Supported timeframes
export const SUPPORTED_TIMEFRAMES = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "12h",
  "1d",
  "1w",
];

// Indicator metadata
export const INDICATOR_METADATA: Record<
  string,
  {
    name: string;
    category: "trend" | "momentum" | "volatility" | "volume" | "pattern";
    description: string;
    parameters?: string[];
  }
> = {
  rsi: {
    name: "Relative Strength Index",
    category: "momentum",
    description: "Measures momentum and overbought/oversold conditions",
    parameters: ["period"],
  },
  macd: {
    name: "MACD",
    category: "trend",
    description: "Trend-following momentum indicator",
    parameters: ["fastPeriod", "slowPeriod", "signalPeriod"],
  },
  bbands: {
    name: "Bollinger Bands",
    category: "volatility",
    description: "Volatility bands around a moving average",
    parameters: ["period", "stdDev"],
  },
  atr: {
    name: "Average True Range",
    category: "volatility",
    description: "Measures market volatility",
    parameters: ["period"],
  },
  adx: {
    name: "Average Directional Index",
    category: "trend",
    description: "Measures trend strength",
    parameters: ["period"],
  },
  obv: {
    name: "On Balance Volume",
    category: "volume",
    description: "Relates price and volume",
    parameters: [],
  },
  ichimoku: {
    name: "Ichimoku Cloud",
    category: "trend",
    description: "Comprehensive trend and support/resistance indicator",
    parameters: ["conversionPeriod", "basePeriod", "spanBPeriod"],
  },
  stochastic: {
    name: "Stochastic Oscillator",
    category: "momentum",
    description: "Compares price to price range over time",
    parameters: ["kPeriod", "dPeriod", "smoothing"],
  },
  ema: {
    name: "Exponential Moving Average",
    category: "trend",
    description: "Weighted moving average emphasizing recent prices",
    parameters: ["period"],
  },
  sma: {
    name: "Simple Moving Average",
    category: "trend",
    description: "Average price over a period",
    parameters: ["period"],
  },
  hma: {
    name: "Hull Moving Average",
    category: "trend",
    description: "Fast-responding moving average",
    parameters: ["period"],
  },
  kdj: {
    name: "KDJ",
    category: "momentum",
    description: "Korean stochastic indicator",
    parameters: ["period"],
  },
  cci: {
    name: "Commodity Channel Index",
    category: "momentum",
    description: "Identifies cyclical trends",
    parameters: ["period"],
  },
  roc: {
    name: "Rate of Change",
    category: "momentum",
    description: "Measures price momentum",
    parameters: ["period"],
  },
  keltner: {
    name: "Keltner Channels",
    category: "volatility",
    description: "Volatility channels using ATR",
    parameters: ["period", "offsetMultiplier"],
  },
  donchian: {
    name: "Donchian Channels",
    category: "volatility",
    description: "Highest high and lowest low over period",
    parameters: ["period"],
  },
  mfi: {
    name: "Money Flow Index",
    category: "volume",
    description: "Volume-weighted RSI",
    parameters: ["period"],
  },
  doji: {
    name: "Doji",
    category: "pattern",
    description: "Candlestick pattern indicating indecision",
    parameters: [],
  },
  engulfing: {
    name: "Engulfing Pattern",
    category: "pattern",
    description: "Reversal candlestick pattern",
    parameters: [],
  },
  hammer: {
    name: "Hammer",
    category: "pattern",
    description: "Bullish reversal pattern",
    parameters: [],
  },
  linear_regression: {
    name: "Linear Regression",
    category: "trend",
    description: "Trend line using least squares",
    parameters: ["period"],
  },
  rvi: {
    name: "Relative Vigor Index",
    category: "momentum",
    description: "Measures conviction of price action",
    parameters: ["period"],
  },
  ma: {
    name: "Moving Average",
    category: "trend",
    description: "Generic moving average",
    parameters: ["period", "type"],
  },
};

// Schema for indicator request
export const IndicatorRequestSchema = z.object({
  exchange: z.enum(SUPPORTED_EXCHANGES.all as [string, ...string[]]),
  symbol: z.string().describe("Trading pair (e.g., BTC/USDT)"),
  timeframe: z.enum(SUPPORTED_TIMEFRAMES as [string, ...string[]]),
  indicators: z
    .array(z.string())
    .describe("Indicator names or group name (minimal, standard, comprehensive)"),
  backtrack: z
    .number()
    .min(0)
    .max(50)
    .optional()
    .describe("Number of candles to backtrack"),
  chart: z
    .enum(["candles", "heikinashi"])
    .optional()
    .describe("Chart type"),
});

export type IndicatorRequest = z.infer<typeof IndicatorRequestSchema>;

// Helper function to get indicators from group or list
export function getIndicators(input: string | string[]): string[] {
  if (typeof input === "string") {
    const group = INDICATOR_GROUPS[input as keyof typeof INDICATOR_GROUPS];
    return group || [input];
  }
  return input;
}

// Helper function to validate exchange
export function isValidExchange(exchange: string): boolean {
  return SUPPORTED_EXCHANGES.all.includes(exchange);
}

// Helper function to validate timeframe
export function isValidTimeframe(timeframe: string): boolean {
  return SUPPORTED_TIMEFRAMES.includes(timeframe);
}

// Helper function to get exchange type
export function getExchangeType(
  exchange: string
): "spot" | "futures" | "unknown" {
  if (SUPPORTED_EXCHANGES.spot.includes(exchange)) return "spot";
  if (SUPPORTED_EXCHANGES.futures.includes(exchange)) return "futures";
  return "unknown";
}

// Helper function to get indicators by category
export function getIndicatorsByCategory(
  category: "trend" | "momentum" | "volatility" | "volume" | "pattern"
): string[] {
  return Object.entries(INDICATOR_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([name, _]) => name);
}

// Helper function to format indicator for API
export function formatIndicatorsForAPI(indicators: string[]): string {
  return indicators.join(",");
}

export default {
  INDICATOR_GROUPS,
  SUPPORTED_EXCHANGES,
  SUPPORTED_TIMEFRAMES,
  INDICATOR_METADATA,
  getIndicators,
  isValidExchange,
  isValidTimeframe,
  getExchangeType,
  getIndicatorsByCategory,
  formatIndicatorsForAPI,
};
