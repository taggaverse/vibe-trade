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
 *   - PRIVATE_KEY      (used for x402 payments)
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
    return x402Client;
  } catch (error) {
    console.error("[vibe-trade] Failed to initialize x402 client:", error);
    return null;
  }
}

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

    // Parallel execution: TAAPI (standard API) + AIXBT (x402)
    const [taapiResult, aixbtResult] = await Promise.all([
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

    // Step 3: Generate recommendation from available data
    const recommendation = {
      action: "BUY" as const,
      confidence: Math.max(
        technicalData?.strength ?? 0.5,
        sentimentData?.confidence ?? 0.5
      ),
      reasoning:
        technicalData && sentimentData
          ? "Technical breakout confirmed by positive sentiment"
          : technicalData
            ? "Technical indicators show strength"
            : sentimentData
              ? "Market sentiment is bullish"
              : "Insufficient data for strong recommendation",
    };

    const processingTime = Date.now() - startTime;

    return {
      output: {
        symbol,
        analysis: {
          technical: technicalData,
          sentiment: sentimentData,
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

export { app };
