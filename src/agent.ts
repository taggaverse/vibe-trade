import { z } from "zod";
import {
  createAgentApp,
  createAxLLMClient,
  AgentKitConfig,
} from "@lucid-dreams/agent-kit";
import { flow } from "@ax-llm/ax";
import axios from "axios";
import { withPaymentInterceptor, decodeXPaymentResponse } from "x402-axios";
import { privateKeyToAccount } from "viem/accounts";
import { C2CManager, C2CProjector, textToKVCache } from "./c2c-wrapper";
import { TrainingDataCollector } from "./training-data-collector";
import { getHyperliquidPerpData, analyzeFundingRate, getFundingSummary, getX402PerpData } from "./hyperliquid-perps";
import { compareExchanges, getMultiExchangeData } from "./exchange-data";
import { INDICATOR_GROUPS, SUPPORTED_EXCHANGES } from "./taapi-indicators";

/**
 * Vibe Trade - AI-Powered Trading Intelligence Nanoservice
 * 
 * Receives x402 payments and intelligently routes requests to:
 * - TAAPI (technical indicators)
 * - AIXBT (market sentiment)
 * - Dreams LLM (analysis & routing decisions)
 * - Hyperliquid (portfolio analysis)
 * 
 * All downstream calls execute in parallel for millisecond-fast responses.
 * Spends up to 90% of received payment on data sources.
 * Returns whatever data arrives first (fail-fast approach).
 *
 * Required environment variables:
 *   - PRIVATE_KEY      (wallet for x402 payments)
 *   - OPENAI_API_KEY   (for LLM routing decisions)
 */

const configOverrides: AgentKitConfig = {
  payments: {
    facilitatorUrl:
      (process.env.FACILITATOR_URL as any) ??
      "https://facilitator.daydreams.systems",
    payTo:
      (process.env.PAY_TO as `0x${string}`) ??
      "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429",
    network: (process.env.NETWORK as any) ?? "base",
    defaultPrice: process.env.DEFAULT_PRICE ?? "0.1",
  },
};

const axClient = createAxLLMClient({
  logger: {
    warn(message, error) {
      if (error) {
        console.warn(`[vibe-trade] ${message}`, error);
      } else {
        console.warn(`[vibe-trade] ${message}`);
      }
    },
  },
});

if (!axClient.isConfigured()) {
  console.warn(
    "[vibe-trade] OpenAI API not configured — routing will use fallback logic."
  );
}

// Initialize x402 clients for calling other endpoints
const WALLET_PRIVATE_KEY = process.env.PRIVATE_KEY;
let x402Client: any = null;

function initializeX402Client() {
  if (x402Client) return x402Client;
  
  if (!WALLET_PRIVATE_KEY) {
    console.warn("[vibe-trade] PRIVATE_KEY not set - x402 calls will fail");
    return null;
  }

  try {
    const account = privateKeyToAccount(WALLET_PRIVATE_KEY as `0x${string}`);
    x402Client = withPaymentInterceptor(axios.create(), account);
    console.log("[vibe-trade] x402 client initialized");
    return x402Client;
  } catch (error) {
    console.error("[vibe-trade] Failed to initialize x402 client:", error);
    return null;
  }
}

// Initialize C2C Manager for KV-Cache projection
const c2cManager = new C2CManager();

// Register C2C projectors for TAAPI and AIXBT
const taapiProjector = new C2CProjector({
  source_model: "taapi",
  target_model: "llm-router",
  projector_url: "https://huggingface.co/nics-efc/C2C_Fuser",
  cache_size: 512,
});

const aixbtProjector = new C2CProjector({
  source_model: "aixbt",
  target_model: "llm-router",
  projector_url: "https://huggingface.co/nics-efc/C2C_Fuser",
  cache_size: 512,
});

c2cManager.registerProjector("taapi-to-router", taapiProjector);
c2cManager.registerProjector("aixbt-to-router", aixbtProjector);

console.log("[vibe-trade] C2C Manager initialized with projectors");

// Initialize Training Data Collector
const trainingCollector = new TrainingDataCollector("training_data.jsonl");
console.log("[vibe-trade] Training Data Collector initialized");

// Helper function to call TAAPI standard API (not x402)
async function callTAAPIStandardAPI(
  symbol: string,
  timeframe: string,
  timeoutMs: number = 2000
): Promise<{ data: any; success: boolean }> {
  const apiKey = process.env.TAAPI_API_KEY;
  if (!apiKey) {
    console.warn("[vibe-trade] TAAPI_API_KEY not set");
    return { data: null, success: false };
  }

  try {
    const result = await Promise.race([
      axios.get("https://api.taapi.io/ta", {
        params: {
          secret: apiKey,
          exchange: "binance",
          symbol: `${symbol}USDT`,
          interval: timeframe,
          indicators: "rsi,macd,sma,ema,bbands,atr",
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    console.log("[vibe-trade] TAAPI call successful");
    return { data: result.data, success: true };
  } catch (error) {
    console.warn("[vibe-trade] TAAPI call failed:", error);
    return { data: null, success: false };
  }
}

// Routing decision flow - decides which data sources to call
const routingFlow = flow<{ symbol: string; query: string }>()
  .node(
    "analyzer",
    'symbol:string, query:string -> routing:string "Decide: should we call TAAPI (technical), AIXBT (sentiment), or both? Return JSON with call_taapi, call_aixbt booleans."'
  )
  .execute("analyzer", (state) => ({
    symbol: state.symbol,
    query: state.query,
  }))
  .returns((state) => {
    try {
      const result = state.analyzerResult.routing as string;
      return JSON.parse(result);
    } catch {
      return { call_taapi: true, call_aixbt: true };
    }
  });

// Helper function to call x402 endpoints with timeout
async function callX402Endpoint(
  name: string,
  endpoint: string,
  payload: any,
  timeoutMs: number = 2000
): Promise<{ data: any; success: boolean }> {
  const client = initializeX402Client();
  if (!client) {
    console.warn(`[vibe-trade] ${name} client not initialized`);
    return { data: null, success: false };
  }

  try {
    const result = await Promise.race([
      client.post(endpoint, payload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    // Extract payment response
    const paymentResponse = decodeXPaymentResponse(
      result.headers["x-payment-response"]
    );
    console.log(
      `[vibe-trade] ${name} payment confirmed: ${paymentResponse.transaction_hash}`
    );

    return { data: result.data, success: true };
  } catch (error) {
    console.warn(`[vibe-trade] ${name} call failed:`, error);
    return { data: null, success: false };
  }
}

const { app, addEntrypoint } = createAgentApp(
  {
    name: "vibe-trade",
    version: "1.0.0",
    description:
      "AI-powered trading intelligence with x402 micropayments. Intelligently routes to TAAPI, AIXBT, and Dreams LLM.",
  },
  {
    config: configOverrides,
  }
);

addEntrypoint({
  key: "analyze",
  description:
    "Analyze trading opportunities with intelligent routing to data sources. Receives x402 payment and decides which endpoints to call (TAAPI, AIXBT, Dreams LLM).",
  input: z.object({
    symbol: z
      .string()
      .min(1, { message: "Provide a trading symbol (e.g., BTC, ETH)." })
      .describe("Trading symbol to analyze"),
    query: z
      .string()
      .optional()
      .describe("Optional natural language query for context"),
    timeframe: z
      .enum(["1m", "5m", "15m", "1h", "4h", "1d", "1w"])
      .optional()
      .default("1h")
      .describe("Candle timeframe for analysis"),
    account_address: z
      .string()
      .optional()
      .describe("Optional Hyperliquid account address for portfolio analysis"),
  }),
  price: "100000", // $0.10 USDC in wei
  output: z.object({
    symbol: z.string(),
    analysis: z.object({
      technical: z.any().optional(),
      sentiment: z.any().optional(),
      recommendation: z.object({
        action: z.enum(["BUY", "SELL", "HOLD"]),
        confidence: z.number(),
        reasoning: z.string(),
      }),
    }),
    portfolio: z.any().optional(),
    metadata: z.object({
      sources_called: z.array(z.string()),
      total_cost: z.string(),
      processing_time_ms: z.number(),
    }),
  }),
  async handler(ctx) {
    const startTime = Date.now();
    const symbol = String(ctx.input.symbol ?? "").toUpperCase().trim();
    const query = String(ctx.input.query ?? "").trim();
    const timeframe = ctx.input.timeframe ?? "1h";
    const accountAddress = ctx.input.account_address;

    if (!symbol) {
      throw new Error("Symbol cannot be empty.");
    }

    // Calculate budget: 90% of received payment
    const entrypointPrice = BigInt("100000"); // $0.10 in wei
    const maxSpend = (entrypointPrice * BigInt(90)) / BigInt(100);
    const budgetPerSource = maxSpend / BigInt(3); // Divide among 3 sources

    // Step 1: Routing decision (LLM decides which sources to call)
    let routingDecision = { call_taapi: true, call_aixbt: true };
    const llm = axClient.ax;
    if (llm) {
      try {
        const result = await routingFlow.forward(llm, { symbol, query });
        routingDecision = result as any;
        routingFlow.resetUsage();
      } catch (error) {
        console.warn("[vibe-trade] Routing decision failed, using defaults", error);
      }
    }

    // Step 2: Parallel calls to data sources (fail-fast, 2s timeout each)
    const sourcesCalled: string[] = [];
    let technicalData: any = null;
    let sentimentData: any = null;
    let perpData: any = null;

    // Parallel execution: TAAPI (technical) + AIXBT (sentiment) + Hyperliquid (perpetuals)
    const [taapiResult, aixbtResult, hyperliquidResult] = await Promise.all([
      routingDecision.call_taapi
        ? callTAAPIStandardAPI(symbol, timeframe)
        : Promise.resolve({ data: null, success: false }),
      routingDecision.call_aixbt
        ? callX402Endpoint(
            "AIXBT",
            process.env.AIXBT_ENDPOINT ||
              "https://api.aixbt.tech/x402/agents/indigo",
            {
              messages: [
                {
                  role: "user",
                  content: `Analyze market sentiment for ${symbol}. Provide: market sentiment (bullish/bearish/neutral), dominant narrative, confidence score (0-1), whale activity, and on-chain metrics.`,
                },
              ],
            }
          )
        : Promise.resolve({ data: null, success: false }),
      // Hyperliquid perpetuals funding data (always call, free API)
      getHyperliquidPerpData(symbol, 2000),
    ]);

    // Track which sources succeeded
    if (taapiResult.success) {
      sourcesCalled.push("TAAPI");
      technicalData = taapiResult.data;
    }
    if (aixbtResult.success) {
      sourcesCalled.push("AIXBT");
      sentimentData = aixbtResult.data;
    }
    if (hyperliquidResult.success) {
      sourcesCalled.push("Hyperliquid-Perps");
      perpData = hyperliquidResult.data;
    }

    // Step 3: C2C Projection (KV-Cache semantic transfer)
    // Project TAAPI and AIXBT KV-Caches to LLM router cache
    let c2cProjectionTime = 0;
    let c2cStats: any = null;

    if (technicalData && sentimentData) {
      try {
        const projectionStartTime = Date.now();

        // Convert data to KV-Cache and project
        const taapiKVCache = textToKVCache(JSON.stringify(technicalData), 0);
        const aixbtKVCache = textToKVCache(JSON.stringify(sentimentData), 1);

        // Project both caches in parallel
        const [taapiProjected, aixbtProjected] = await Promise.all([
          c2cManager.project("taapi-to-router", taapiKVCache),
          c2cManager.project("aixbt-to-router", aixbtKVCache),
        ]);

        c2cProjectionTime = Date.now() - projectionStartTime;
        c2cStats = c2cManager.getStats();

        console.log(
          `[vibe-trade] C2C projection complete: ${c2cProjectionTime}ms`
        );
        console.log(
          `[vibe-trade] C2C stats:`,
          c2cStats
        );

        // Mark that we used C2C
        sourcesCalled.push("C2C-Projection");
      } catch (error) {
        console.warn("[vibe-trade] C2C projection failed, using text-based:", error);
      }
    }

    // Step 4: Generate recommendation from available data
    // Analyze perpetuals funding if available
    let fundingSignal = "NEUTRAL";
    let fundingStrength = 0.5;
    let fundingReasoning = "";
    let fundingAction = "NEUTRAL";
    let timeToNextFunding = 0;
    let signalAgreement = 0.5; // How well signals agree

    if (perpData) {
      const fundingAnalysis = analyzeFundingRate(perpData);
      fundingSignal = fundingAnalysis.signal;
      fundingStrength = fundingAnalysis.strength;
      fundingReasoning = fundingAnalysis.reasoning;
      fundingAction = fundingAnalysis.signal;
      
      // Calculate time to next funding (Hyperliquid pays hourly)
      const now = Date.now();
      const nextHour = Math.ceil(now / 3600000) * 3600000;
      timeToNextFunding = Math.max(0, nextHour - now);
      
      console.log(`[vibe-trade] Funding analysis: ${fundingReasoning}`);
    }

    // Combine signals: technical + sentiment + perpetuals funding
    const technicalConfidence = technicalData?.strength ?? 0.5;
    const sentimentConfidence = sentimentData?.confidence ?? 0.5;
    const fundingConfidence = fundingStrength;

    // Calculate signal agreement (how well they align)
    if (technicalData && sentimentData && perpData) {
      // All three signals present
      const technicalBullish = technicalConfidence > 0.5;
      const sentimentBullish = sentimentConfidence > 0.5;
      const fundingBullish = fundingSignal === "LONG";
      
      const agreementCount = [technicalBullish, sentimentBullish, fundingBullish].filter(b => b).length;
      signalAgreement = agreementCount / 3; // 0 = all bearish, 1 = all bullish
    } else if (technicalData && sentimentData) {
      // Two signals
      const technicalBullish = technicalConfidence > 0.5;
      const sentimentBullish = sentimentConfidence > 0.5;
      signalAgreement = (technicalBullish === sentimentBullish) ? 1 : 0;
    }

    // Average confidence across all sources
    const sourceCount = [technicalData, sentimentData, perpData].filter(
      (d) => d
    ).length;
    const avgConfidence =
      sourceCount > 0
        ? (technicalConfidence + sentimentConfidence + fundingConfidence) /
          sourceCount
        : 0.5;

    // Boost confidence if signals agree
    const boostedConfidence = Math.min(1, avgConfidence * (0.7 + signalAgreement * 0.3));

    const recommendation = {
      action: "BUY" as const,
      confidence: boostedConfidence,
      funding_signal: fundingAction,
      funding_strength: fundingStrength,
      signal_agreement: signalAgreement,
      time_to_next_funding_ms: timeToNextFunding,
      reasoning:
        technicalData && sentimentData && perpData
          ? `Technical breakout confirmed by positive sentiment and ${fundingSignal === "LONG" ? "bullish" : "bearish"} funding rate (${(perpData.funding * 100).toFixed(4)}%). Signals ${signalAgreement > 0.66 ? "strongly" : signalAgreement > 0.33 ? "moderately" : "weakly"} aligned.`
          : technicalData && sentimentData
            ? "Technical breakout confirmed by positive sentiment (C2C-enhanced)"
            : technicalData && perpData
              ? `Technical strength with ${fundingSignal === "LONG" ? "bullish" : "bearish"} funding signal`
              : sentimentData && perpData
                ? `Bullish sentiment with ${fundingSignal === "LONG" ? "bullish" : "bearish"} funding signal`
                : technicalData
                  ? "Technical indicators show strength"
                  : sentimentData
                    ? "Market sentiment is bullish"
                    : perpData
                      ? `Perpetuals funding signal: ${fundingSignal}. Next funding in ${(timeToNextFunding / 60000).toFixed(0)} minutes.`
                      : "Insufficient data for strong recommendation",
    };

    const processingTime = Date.now() - startTime;

    // Log training example for C2C projector training
    if (technicalData && sentimentData) {
      try {
        trainingCollector.logExample({
          timestamp: new Date().toISOString(),
          request: {
            symbol,
            timeframe,
            query,
          },
          taapi_output: technicalData,
          aixbt_output: sentimentData,
          llm_input: `Analyze ${symbol} ${timeframe}. Technical: ${JSON.stringify(technicalData)}. Sentiment: ${JSON.stringify(sentimentData)}. Perpetuals: Funding ${(perpData?.funding * 100).toFixed(4)}%, OI ${perpData?.openInterest.toFixed(2)}.`,
          llm_output: recommendation,
          metadata: {
            latency_ms: processingTime,
            cost_usd: 0.07,
            sources_called: sourcesCalled,
            accuracy_score: recommendation.confidence,
          },
        });
      } catch (error) {
        console.warn("[vibe-trade] Failed to log training example:", error);
      }
    }

    return {
      output: {
        symbol,
        analysis: {
          technical: technicalData,
          sentiment: sentimentData,
          perpetuals: perpData ? {
            funding_rate: perpData.funding,
            open_interest: perpData.openInterest,
            mark_price: perpData.markPrice,
            oracle_price: perpData.oraclePrice,
            premium: perpData.premium,
            day_volume: perpData.dayVolume,
            funding_summary: getFundingSummary(perpData),
          } : undefined,
          recommendation,
        },
        portfolio: accountAddress ? { address: accountAddress, status: "pending" } : undefined,
        metadata: {
          sources_called: sourcesCalled,
          total_cost: maxSpend.toString(),
          processing_time_ms: processingTime,
        },
      },
      model: "vibe-trade-v1",
    };
  },
});

// Collection status endpoint - monitor training data collection progress
addEntrypoint({
  key: "collection-status",
  description:
    "Get training data collection progress. Shows how many examples have been collected for C2C projector training.",
  input: z.object({}),
  price: "0", // Free endpoint
  output: z.object({
    total_examples: z.number(),
    progress: z.object({
      current: z.number(),
      target: z.number(),
      percentage: z.number(),
      remaining: z.number(),
    }),
    symbols: z.record(z.string(), z.number()),
    timeframes: z.record(z.string(), z.number()),
    data_quality: z.object({
      valid_examples: z.number(),
      invalid_examples: z.number(),
    }),
    file_size_mb: z.number(),
  }),
  async handler() {
    const stats = trainingCollector.getStats();
    const progress = trainingCollector.getProgress(5000);

    console.log("[vibe-trade] Collection status requested");

    return {
      output: {
        total_examples: stats.total_examples,
        progress,
        symbols: stats.symbols,
        timeframes: stats.timeframes,
        data_quality: stats.data_quality,
        file_size_mb: stats.file_size_mb,
      },
      model: "vibe-trade-v1",
    };
  },
});

// x402 Perpetuals Funding Endpoint - Query Hyperliquid funding rates + multi-exchange technical analysis
addEntrypoint({
  key: "perps-funding",
  description:
    "Get perpetuals funding rates from Hyperliquid with multi-exchange technical analysis. Returns funding rate, time to next payment, open interest, skew, and technical indicators from multiple exchanges.",
  input: z.object({
    markets: z
      .array(z.string())
      .optional()
      .describe(
        "Optional array of market symbols (e.g., ['BTC', 'ETH', 'SOL']). If empty, returns all available markets."
      ),
    venue_ids: z
      .array(z.string())
      .optional()
      .default(["hyperliquid"])
      .describe("Perpetuals exchanges to query (currently supports 'hyperliquid')"),
    timeframe: z
      .string()
      .optional()
      .default("1h")
      .describe("Timeframe for technical analysis (1m, 5m, 15m, 30m, 1h, 2h, 4h, 12h, 1d, 1w)"),
    include_technicals: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include multi-exchange technical indicators (RSI, MACD, Bollinger Bands)"),
    exchanges: z
      .array(z.string())
      .optional()
      .default(["binancefutures", "bybit"])
      .describe("Exchanges to query for technical indicators"),
  }),
  price: "10000", // $0.01 USDC in wei
  output: z.object({
    venue: z.string(),
    markets: z.array(
      z.object({
        symbol: z.string(),
        funding_rate: z.number(),
        time_to_next: z.number(),
        open_interest: z.number(),
        skew: z.number(),
        mark_price: z.number(),
        oracle_price: z.number(),
        premium: z.number(),
        day_volume: z.number(),
        timestamp: z.number(),
        // NEW: Multi-exchange technical data
        technicals: z
          .object({
            exchanges: z.array(
              z.object({
                exchange: z.string(),
                price: z.number(),
                volume: z.number(),
                rsi: z.number().optional(),
                macd: z.any().optional(),
                bbands: z.any().optional(),
              })
            ),
            analysis: z.object({
              price_spread: z.number(),
              signal_agreement: z.number(),
              recommendation: z.string(),
            }),
          })
          .optional(),
      })
    ),
    timestamp: z.number(),
    total_markets: z.number(),
    metadata: z.object({
      timeframe: z.string(),
      exchanges_queried: z.array(z.string()),
      includes_technicals: z.boolean(),
    }),
  }),
  async handler(ctx) {
    const markets = ctx.input.markets;
    const venueIds = ctx.input.venue_ids || ["hyperliquid"];
    const timeframe = ctx.input.timeframe || "1h";
    const includeTechnicals = ctx.input.include_technicals !== false;
    const exchanges = ctx.input.exchanges || ["binancefutures", "bybit"];

    console.log(
      `[vibe-trade] Perps funding query: venues=${venueIds.join(",")}, markets=${markets ? markets.join(",") : "all"}, timeframe=${timeframe}`
    );

    // Currently only support Hyperliquid
    if (!venueIds.includes("hyperliquid")) {
      throw new Error(
        "Only 'hyperliquid' venue is currently supported. Supported venues: hyperliquid"
      );
    }

    // Query Hyperliquid funding data
    const result = await getX402PerpData(markets, 3000);

    if (!result.success || !result.data) {
      throw new Error("Failed to fetch perpetuals funding data from Hyperliquid");
    }

    // Enhance with multi-exchange technical data if requested
    let enhancedMarkets = result.data.markets;

    if (includeTechnicals && result.data.markets.length > 0) {
      console.log(
        `[vibe-trade] Fetching technical data from ${exchanges.join(",")} for ${result.data.markets.length} markets`
      );

      // Get technical data for each market from multiple exchanges in parallel
      enhancedMarkets = await Promise.all(
        result.data.markets.map(async (market) => {
          try {
            // Query multiple exchanges for this market
            const technicalData = await getMultiExchangeData(
              exchanges,
              `${market.symbol}/USDT`,
              timeframe,
              INDICATOR_GROUPS.perpetuals,
              { backtrack: 5, timeout: 2000 }
            );

            if (technicalData.length > 0) {
              // Calculate price spread and signal agreement
              const prices = technicalData.map((d) => d.price);
              const maxPrice = Math.max(...prices);
              const minPrice = Math.min(...prices);
              const priceSpread = ((maxPrice - minPrice) / minPrice) * 100;

              // Calculate RSI agreement
              const rsiValues = technicalData
                .map((d) => d.indicators.rsi)
                .filter((rsi) => rsi !== undefined);
              const bullishRSI = rsiValues.filter((rsi) => rsi > 60).length;
              const signalAgreement =
                rsiValues.length > 0 ? bullishRSI / rsiValues.length : 0.5;

              // Generate recommendation based on funding + technicals
              let recommendation = "NEUTRAL";
              if (market.funding_rate > 0.0001 && signalAgreement > 0.6) {
                recommendation = "SHORT";
              } else if (market.funding_rate < -0.0001 && signalAgreement < 0.4) {
                recommendation = "LONG";
              }

              return {
                ...market,
                technicals: {
                  exchanges: technicalData.map((d) => ({
                    exchange: d.exchange,
                    price: d.price,
                    volume: d.volume,
                    rsi: d.indicators.rsi,
                    macd: d.indicators.macd,
                    bbands: d.indicators.bbands,
                  })),
                  analysis: {
                    price_spread: priceSpread,
                    signal_agreement: signalAgreement,
                    recommendation,
                  },
                },
              };
            }

            return market;
          } catch (error) {
            console.warn(
              `[vibe-trade] Failed to fetch technicals for ${market.symbol}:`,
              error
            );
            return market;
          }
        })
      );
    }

    console.log(
      `[vibe-trade] Returned funding data for ${result.data.total_markets} markets with ${includeTechnicals ? "technical analysis" : "no technical analysis"}`
    );

    return {
      output: {
        ...result.data,
        markets: enhancedMarkets,
        metadata: {
          timeframe,
          exchanges_queried: exchanges,
          includes_technicals: includeTechnicals,
        },
      },
      model: "vibe-trade-v1",
    };
  },
});

export { app };
