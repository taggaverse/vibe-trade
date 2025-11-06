/**
 * Multi-Exchange Data Fetching Module
 * 
 * Fetches technical indicator data from multiple exchanges via TAAPI
 * Supports spot and futures markets across 8+ exchanges
 */

import axios from "axios";
import { z } from "zod";
import {
  SUPPORTED_EXCHANGES,
  getIndicators,
  formatIndicatorsForAPI,
  IndicatorRequest,
} from "./taapi-indicators";

// Exchange data response schema
export const ExchangeDataSchema = z.object({
  exchange: z.string(),
  symbol: z.string(),
  timeframe: z.string(),
  price: z.number(),
  volume: z.number(),
  indicators: z.record(z.any()),
  metadata: z.object({
    timestamp: z.number(),
    source: z.literal("taapi"),
    exchange: z.string(),
  }),
});

export type ExchangeData = z.infer<typeof ExchangeDataSchema>;

// Exchange comparison schema
export const ExchangeComparisonSchema = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  exchanges: z.array(ExchangeDataSchema),
  analysis: z.object({
    priceSpread: z.number(),
    volumeLeader: z.string(),
    volumeSpread: z.number(),
    signalAgreement: z.number(),
    recommendation: z.string(),
  }),
});

export type ExchangeComparison = z.infer<typeof ExchangeComparisonSchema>;

/**
 * Fetch technical indicator data from a specific exchange
 */
export async function getExchangeData(
  exchange: string,
  symbol: string,
  timeframe: string,
  indicators: string | string[],
  options?: {
    backtrack?: number;
    chart?: "candles" | "heikinashi";
    timeout?: number;
  }
): Promise<ExchangeData> {
  const apiKey = process.env.TAAPI_API_KEY;
  if (!apiKey) {
    throw new Error("TAAPI_API_KEY not set");
  }

  const indicatorList = getIndicators(indicators);
  const timeoutMs = options?.timeout ?? 2000;

  try {
    const result = await Promise.race([
      axios.get("https://api.taapi.io/ta", {
        params: {
          secret: apiKey,
          exchange,
          symbol,
          interval: timeframe,
          indicators: formatIndicatorsForAPI(indicatorList),
          backtrack: options?.backtrack ?? 5,
          chart: options?.chart ?? "candles",
          ohlcv: true,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    const data = (result as any).data;

    return {
      exchange,
      symbol,
      timeframe,
      price: data.close || 0,
      volume: data.volume || 0,
      indicators: data,
      metadata: {
        timestamp: Date.now(),
        source: "taapi",
        exchange,
      },
    };
  } catch (error) {
    console.warn(
      `[vibe-trade] Failed to fetch ${exchange} data for ${symbol}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetch data from multiple exchanges in parallel
 */
export async function getMultiExchangeData(
  exchanges: string[],
  symbol: string,
  timeframe: string,
  indicators: string | string[],
  options?: {
    backtrack?: number;
    chart?: "candles" | "heikinashi";
    timeout?: number;
  }
): Promise<ExchangeData[]> {
  const results = await Promise.allSettled(
    exchanges.map((exchange) =>
      getExchangeData(exchange, symbol, timeframe, indicators, options)
    )
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<ExchangeData>).value);
}

/**
 * Calculate price spread between exchanges
 */
export function calculatePriceSpread(data: ExchangeData[]): number {
  if (data.length < 2) return 0;

  const prices = data.map((d) => d.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  return ((maxPrice - minPrice) / minPrice) * 100;
}

/**
 * Calculate volume spread between exchanges
 */
export function calculateVolumeSpread(data: ExchangeData[]): number {
  if (data.length < 2) return 0;

  const volumes = data.map((d) => d.volume);
  const maxVolume = Math.max(...volumes);
  const minVolume = Math.min(...volumes);

  return ((maxVolume - minVolume) / minVolume) * 100;
}

/**
 * Find exchange with highest volume
 */
export function findVolumeLeader(data: ExchangeData[]): string {
  if (data.length === 0) return "unknown";
  return data.reduce((leader, current) =>
    current.volume > leader.volume ? current : leader
  ).exchange;
}

/**
 * Compare RSI signals across exchanges
 */
export function compareRSISignals(data: ExchangeData[]): {
  agreement: number;
  bullish: number;
  bearish: number;
  neutral: number;
} {
  const signals = data
    .map((d) => d.indicators.rsi)
    .filter((rsi) => rsi !== undefined);

  if (signals.length === 0) {
    return { agreement: 0, bullish: 0, bearish: 0, neutral: 0 };
  }

  const bullish = signals.filter((rsi) => rsi > 60).length;
  const bearish = signals.filter((rsi) => rsi < 40).length;
  const neutral = signals.length - bullish - bearish;

  const maxCount = Math.max(bullish, bearish, neutral);
  const agreement = maxCount / signals.length;

  return { agreement, bullish, bearish, neutral };
}

/**
 * Compare MACD signals across exchanges
 */
export function compareMACDSignals(data: ExchangeData[]): {
  agreement: number;
  bullish: number;
  bearish: number;
} {
  const signals = data
    .map((d) => {
      const macd = d.indicators.macd;
      if (!macd) return null;
      return macd.histogram > 0 ? "bullish" : "bearish";
    })
    .filter((s) => s !== null);

  if (signals.length === 0) {
    return { agreement: 0, bullish: 0, bearish: 0 };
  }

  const bullish = signals.filter((s) => s === "bullish").length;
  const bearish = signals.length - bullish;

  const maxCount = Math.max(bullish, bearish);
  const agreement = maxCount / signals.length;

  return { agreement, bullish, bearish };
}

/**
 * Calculate overall signal agreement across exchanges
 */
export function calculateSignalAgreement(data: ExchangeData[]): number {
  if (data.length < 2) return 0.5;

  const rsiAgreement = compareRSISignals(data).agreement;
  const macdAgreement = compareMACDSignals(data).agreement;

  return (rsiAgreement + macdAgreement) / 2;
}

/**
 * Generate recommendation based on exchange comparison
 */
export function generateExchangeRecommendation(
  data: ExchangeData[],
  agreement: number
): string {
  if (agreement > 0.8) {
    // Check if bullish or bearish
    const rsiSignals = compareRSISignals(data);
    return rsiSignals.bullish > rsiSignals.bearish
      ? "STRONG_BUY"
      : "STRONG_SELL";
  } else if (agreement > 0.6) {
    const rsiSignals = compareRSISignals(data);
    return rsiSignals.bullish > rsiSignals.bearish ? "BUY" : "SELL";
  } else if (agreement > 0.4) {
    return "NEUTRAL";
  } else {
    return "CONFLICTING_SIGNALS";
  }
}

/**
 * Compare exchanges and generate analysis
 */
export async function compareExchanges(
  symbol: string,
  timeframe: string,
  exchanges: string[],
  indicators?: string | string[]
): Promise<ExchangeComparison> {
  const indicatorList = indicators || ["rsi", "macd", "bbands"];

  const data = await getMultiExchangeData(
    exchanges,
    symbol,
    timeframe,
    indicatorList,
    { backtrack: 5, timeout: 3000 }
  );

  if (data.length === 0) {
    throw new Error("Failed to fetch data from any exchange");
  }

  const priceSpread = calculatePriceSpread(data);
  const volumeSpread = calculateVolumeSpread(data);
  const volumeLeader = findVolumeLeader(data);
  const signalAgreement = calculateSignalAgreement(data);
  const recommendation = generateExchangeRecommendation(data, signalAgreement);

  return {
    symbol,
    timeframe,
    exchanges: data,
    analysis: {
      priceSpread,
      volumeLeader,
      volumeSpread,
      signalAgreement,
      recommendation,
    },
  };
}

export default {
  getExchangeData,
  getMultiExchangeData,
  calculatePriceSpread,
  calculateVolumeSpread,
  findVolumeLeader,
  compareRSISignals,
  compareMACDSignals,
  calculateSignalAgreement,
  generateExchangeRecommendation,
  compareExchanges,
};
