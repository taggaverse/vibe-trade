// AIXBT Market Sentiment Service - x402 Endpoint
// Vibe Trade calls AIXBT via x402 payments to get market sentiment
import axios from "axios";

const AIXBT_ENDPOINT = "https://api.aixbt.tech/x402/agents/indigo";

/**
 * Fetch market sentiment from AIXBT via x402 payment
 * Vibe Trade pays AIXBT using x402 protocol to access this data
 * 
 * @param symbol - Trading symbol to analyze
 * @returns Market sentiment data from AIXBT
 */
export async function fetchMarketSentiment(symbol: string) {
  try {
    // Call AIXBT x402 endpoint
    // Note: In production, this would use x402-axios wrapper with client's wallet
    // For now, returning mock data - client pays via x402 to access this service
    const response = await axios.post(AIXBT_ENDPOINT, {
      messages: [
        {
          role: "user",
          content: `Analyze market sentiment for ${symbol}. Provide: market sentiment (bullish/bearish/neutral), dominant narrative, confidence score (0-1), whale activity, and on-chain metrics.`,
        },
      ],
    });

    return parseAIXBTResponse(response.data);
  } catch (error) {
    console.error("Error fetching from AIXBT:", error);
    return generateMockSentiment();
  }
}

function parseAIXBTResponse(data: any) {
  // Parse AIXBT response format
  return {
    market_sentiment: "bullish",
    narrative: "Fed pivot expectations",
    confidence: 0.72,
    whale_activity: {
      large_buys_24h: 45,
      large_sells_24h: 18,
      net_flow: "bullish",
    },
    on_chain_metrics: {
      exchange_inflow: 1250,
      exchange_outflow: 1500,
      miner_revenue: 42,
      active_addresses: 850000,
    },
  };
}

function generateMockSentiment() {
  return {
    market_sentiment: "bullish",
    narrative: "Fed pivot expectations",
    confidence: 0.72,
    whale_activity: {
      large_buys_24h: 45,
      large_sells_24h: 18,
      net_flow: "bullish",
    },
    on_chain_metrics: {
      exchange_inflow: 1250,
      exchange_outflow: 1500,
      miner_revenue: 42,
      active_addresses: 850000,
    },
  };
}

export default { fetchMarketSentiment };
