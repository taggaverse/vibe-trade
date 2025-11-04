/**
 * Hyperliquid Perpetuals Module
 * 
 * Fetches perpetuals funding rates, open interest, and other market data
 * from Hyperliquid DEX.
 * 
 * API: https://api.hyperliquid.xyz/info (public, no auth required)
 */

import axios from "axios";

const HYPERLIQUID_API = "https://api.hyperliquid.xyz/info";

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

export default {
  getHyperliquidPerpData,
  getHistoricalFunding,
  analyzeFundingRate,
  getFundingSummary,
};
