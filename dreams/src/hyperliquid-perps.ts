/**
 * Hyperliquid Perpetuals Module
 * 
 * Fetches perpetuals funding rates, open interest, and other market data
 * from Hyperliquid DEX. Supports both direct queries and x402 endpoint.
 * 
 * API: https://api.hyperliquid.xyz/info (public, no auth required)
 */

import axios from "axios";

const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";

// Cache for all available markets
let marketsCache: HyperliquidMarket[] | null = null;
let marketsCacheTime = 0;
const MARKETS_CACHE_TTL = 3600000; // 1 hour

export interface HyperliquidMarket {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface HyperliquidPerpData {
  symbol: string;
  funding: number; // Current 8-hour funding rate
  openInterest: number; // Total open interest
  markPrice: number; // Mark price
  oraclePrice: number; // Oracle price
  premium: number; // Spot-perp basis
  dayVolume: number; // 24h notional volume
  impactBid: number; // Bid impact price
  impactAsk: number; // Ask impact price
  prevDayPrice: number; // Previous day close
  timestamp: number;
}

export interface FundingData {
  symbol: string;
  funding_rate: number; // Current 8-hour funding rate (as percentage)
  time_to_next: number; // Milliseconds until next funding payment
  open_interest: number; // Total open interest in contracts
  skew: number; // Long/short skew ratio (long_oi / short_oi)
  mark_price: number;
  oracle_price: number;
  premium: number; // Basis in percentage
  day_volume: number;
  timestamp: number;
}

export interface X402PerpResponse {
  venue: string;
  markets: FundingData[];
  timestamp: number;
  total_markets: number;
}

export interface HyperliquidHistoricalFunding {
  coin: string;
  fundingRate: number;
  premium: number;
  time: number;
}

/**
 * Fetch current perpetuals data from Hyperliquid
 */
export async function getHyperliquidPerpData(
  symbol: string,
  timeoutMs: number = 2000
): Promise<{ data: HyperliquidPerpData | null; success: boolean }> {
  try {
    // Normalize symbol (remove USDT suffix if present)
    const coin = symbol.replace("USDT", "").toUpperCase();

    // Fetch all asset contexts
    const response = await Promise.race([
      axios.post(
        HYPERLIQUID_API,
        {
          type: "metaAndAssetCtxs",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    const [meta, assetCtxs] = response.data;

    // Find the asset in the universe
    const assetIndex = meta.universe.findIndex(
      (asset: any) => asset.name === coin
    );

    if (assetIndex === -1) {
      console.warn(`[Hyperliquid] Symbol ${coin} not found in universe`);
      return { data: null, success: false };
    }

    // Get the asset context
    const ctx = assetCtxs[assetIndex];

    if (!ctx) {
      console.warn(`[Hyperliquid] No context data for ${coin}`);
      return { data: null, success: false };
    }

    // Parse the data
    const perpData: HyperliquidPerpData = {
      symbol: coin,
      funding: parseFloat(ctx.funding),
      openInterest: parseFloat(ctx.openInterest),
      markPrice: parseFloat(ctx.markPx),
      oraclePrice: parseFloat(ctx.oraclePx),
      premium: parseFloat(ctx.premium),
      dayVolume: parseFloat(ctx.dayNtlVlm),
      impactBid: parseFloat(ctx.impactPxs[0]),
      impactAsk: parseFloat(ctx.impactPxs[1]),
      prevDayPrice: parseFloat(ctx.prevDayPx),
      timestamp: Date.now(),
    };

    console.log(`[Hyperliquid] Fetched perp data for ${coin}`);
    return { data: perpData, success: true };
  } catch (error) {
    console.warn("[Hyperliquid] Failed to fetch perp data:", error);
    return { data: null, success: false };
  }
}

/**
 * Fetch historical funding rates from Hyperliquid
 */
export async function getHistoricalFunding(
  symbol: string,
  startTime: number,
  endTime: number = Date.now(),
  timeoutMs: number = 2000
): Promise<{
  data: HyperliquidHistoricalFunding[] | null;
  success: boolean;
}> {
  try {
    const coin = symbol.replace("USDT", "").toUpperCase();

    const response = await Promise.race([
      axios.post(
        HYPERLIQUID_API,
        {
          type: "fundingHistory",
          coin,
          startTime,
          endTime,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    console.log(
      `[Hyperliquid] Fetched ${response.data.length} historical funding records for ${coin}`
    );
    return { data: response.data, success: true };
  } catch (error) {
    console.warn("[Hyperliquid] Failed to fetch historical funding:", error);
    return { data: null, success: false };
  }
}

/**
 * Analyze funding rate for trading signals
 */
export function analyzeFundingRate(perpData: HyperliquidPerpData): {
  signal: "LONG" | "SHORT" | "NEUTRAL";
  strength: number;
  reasoning: string;
} {
  const funding = perpData.funding;
  const premium = perpData.premium;

  // Funding rate interpretation:
  // Positive funding: Longs paying shorts (bullish signal for shorts)
  // Negative funding: Shorts paying longs (bullish signal for longs)

  if (funding < -0.0001) {
    // Strong negative funding - shorts paying longs
    return {
      signal: "LONG",
      strength: Math.min(Math.abs(funding) * 10000, 1.0),
      reasoning: `Negative funding rate (${(funding * 100).toFixed(4)}%) - shorts paying longs, bullish signal`,
    };
  } else if (funding > 0.0001) {
    // Strong positive funding - longs paying shorts
    return {
      signal: "SHORT",
      strength: Math.min(funding * 10000, 1.0),
      reasoning: `Positive funding rate (${(funding * 100).toFixed(4)}%) - longs paying shorts, bearish signal`,
    };
  } else {
    // Neutral funding
    return {
      signal: "NEUTRAL",
      strength: 0.5,
      reasoning: `Neutral funding rate (${(funding * 100).toFixed(4)}%) - no strong signal`,
    };
  }
}

/**
 * Get funding rate summary for analysis
 */
export function getFundingSummary(perpData: HyperliquidPerpData): string {
  const fundingPercent = (perpData.funding * 100).toFixed(4);
  const premiumPercent = (perpData.premium * 100).toFixed(4);
  const basisBps = (perpData.premium * 10000).toFixed(0);

  return `Hyperliquid ${perpData.symbol} Perpetuals: Funding ${fundingPercent}% (${perpData.funding > 0 ? "longs paying" : "shorts paying"}), Premium ${premiumPercent}% (${basisBps} bps), OI ${perpData.openInterest.toFixed(2)}, 24h Vol $${(perpData.dayVolume / 1000000).toFixed(2)}M`;
}

/**
 * Fetch all available Hyperliquid perpetuals markets
 */
export async function getAllHyperliquidMarkets(
  timeoutMs: number = 2000
): Promise<HyperliquidMarket[]> {
  // Check cache first
  if (marketsCache && Date.now() - marketsCacheTime < MARKETS_CACHE_TTL) {
    return marketsCache;
  }

  try {
    const response = await Promise.race([
      axios.post(
        HYPERLIQUID_API,
        { type: "meta" },
        { headers: { "Content-Type": "application/json" } }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    const meta = (response as any).data;
    const markets = meta.universe || [];

    // Cache the markets
    marketsCache = markets;
    marketsCacheTime = Date.now();

    console.log(`[Hyperliquid] Fetched ${markets.length} available markets`);
    return markets;
  } catch (error) {
    console.warn("[Hyperliquid] Failed to fetch markets:", error);
    return [];
  }
}

/**
 * Calculate time until next funding payment (Hyperliquid pays every hour)
 */
export function getTimeToNextFunding(): number {
  const now = Date.now();
  const nextHour = Math.ceil(now / 3600000) * 3600000;
  return Math.max(0, nextHour - now);
}

/**
 * Calculate long/short skew ratio from open interest
 * Note: Hyperliquid doesn't directly provide long/short OI split,
 * so we estimate based on premium (positive premium = more longs)
 */
export function calculateSkew(premium: number, openInterest: number): number {
  // Premium indicates directional bias
  // Positive premium = more longs, negative = more shorts
  // Estimate skew based on premium magnitude
  const skewFactor = 1 + premium * 100; // Convert to percentage-based factor
  return Math.max(0.1, Math.min(10, skewFactor)); // Clamp between 0.1 and 10
}

/**
 * Get x402-compatible perpetuals data for all or specific markets
 * 
 * @param markets - Optional array of market symbols to query. If empty, returns all.
 * @param timeoutMs - Timeout in milliseconds
 * @returns X402-compatible response with funding data
 */
export async function getX402PerpData(
  markets?: string[],
  timeoutMs: number = 3000
): Promise<{ data: X402PerpResponse | null; success: boolean }> {
  try {
    // Get all available markets
    const allMarkets = await getAllHyperliquidMarkets(timeoutMs);

    if (allMarkets.length === 0) {
      console.warn("[Hyperliquid] No markets available");
      return { data: null, success: false };
    }

    // Filter to requested markets or use all
    const targetMarkets = markets && markets.length > 0
      ? allMarkets.filter((m) => markets.includes(m.name))
      : allMarkets;

    // Fetch all asset contexts
    const response = await Promise.race([
      axios.post(
        HYPERLIQUID_API,
        { type: "metaAndAssetCtxs" },
        { headers: { "Content-Type": "application/json" } }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    const [meta, assetCtxs] = (response as any).data;

    // Build funding data for each market
    const fundingDataList: FundingData[] = [];

    for (let i = 0; i < targetMarkets.length; i++) {
      const market = targetMarkets[i];
      const ctx = assetCtxs[i];

      if (!ctx) continue;

      const funding = parseFloat(ctx.funding);
      const premium = parseFloat(ctx.premium);
      const openInterest = parseFloat(ctx.openInterest);

      const fundingData: FundingData = {
        symbol: market.name,
        funding_rate: funding,
        time_to_next: getTimeToNextFunding(),
        open_interest: openInterest,
        skew: calculateSkew(premium, openInterest),
        mark_price: parseFloat(ctx.markPx),
        oracle_price: parseFloat(ctx.oraclePx),
        premium: premium,
        day_volume: parseFloat(ctx.dayNtlVlm),
        timestamp: Date.now(),
      };

      fundingDataList.push(fundingData);
    }

    const x402Response: X402PerpResponse = {
      venue: "hyperliquid",
      markets: fundingDataList,
      timestamp: Date.now(),
      total_markets: fundingDataList.length,
    };

    console.log(
      `[Hyperliquid] Fetched x402 perp data for ${fundingDataList.length} markets`
    );
    return { data: x402Response, success: true };
  } catch (error) {
    console.warn("[Hyperliquid] Failed to fetch x402 perp data:", error);
    return { data: null, success: false };
  }
}

export default {
  getHyperliquidPerpData,
  getHistoricalFunding,
  analyzeFundingRate,
  getFundingSummary,
  getAllHyperliquidMarkets,
  getTimeToNextFunding,
  calculateSkew,
  getX402PerpData,
};
