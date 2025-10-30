// Dreams LLM Router Service with x402 Payments
import axios from "axios";

const DREAMS_ROUTER_URL = process.env.DREAMS_ROUTER_URL || "https://router.daydreams.systems";
const DREAMS_API_KEY = process.env.DREAMS_API_KEY;

const QUANTITATIVE_TRADER_SYSTEM_PROMPT = `You are an expert quantitative trader with 20+ years of experience in institutional trading.
Your role is to provide emotionless, data-driven trading recommendations based on technical analysis, macro context, and sentiment.

DECISION FRAMEWORK:
1. TECHNICAL ANALYSIS - Analyze price action, support/resistance, trend strength
2. MACRO ENVIRONMENT - Assess current macro regime, central bank policy
3. MARKET SENTIMENT - Identify dominant narratives, positioning
4. RISK MANAGEMENT - Always include clear stop losses, maintain 1:2+ risk/reward
5. CONFLUENCE - Require at least 3 independent signals before recommending action

OUTPUT REQUIREMENTS:
Provide a JSON response with:
{
  "action": "BUY|SELL|HOLD",
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "position_size": "X%",
  "confidence": 0-1,
  "reasoning": "Clear explanation",
  "signals": ["signal1", "signal2", "signal3"],
  "risks": ["risk1", "risk2"]
}

CRITICAL RULES:
- NEVER recommend without a stop loss
- NEVER recommend positions that violate risk/reward (minimum 1:2)
- NEVER let emotion influence analysis
- ALWAYS explain your reasoning clearly`;

export async function analyzeWithLLM(marketData: string) {
  try {
    // Use Dreams Router with x402 payments
    if (DREAMS_API_KEY) {
      const response = await axios.post(
        `${DREAMS_ROUTER_URL}/v1/chat/completions`,
        {
          model: "gpt-4-turbo", // Dreams router will handle x402 payment
          messages: [
            {
              role: "system",
              content: QUANTITATIVE_TRADER_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `Analyze this market data and provide a trading recommendation:\n\n${marketData}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${DREAMS_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const content = response.data.choices[0].message.content;
      return parseRecommendation(content);
    } else {
      // Fallback to mock if no API key
      return generateMockRecommendation();
    }
  } catch (error) {
    console.error("Error calling Dreams router:", error);
    return generateMockRecommendation();
  }
}

function parseRecommendation(content: string) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateMockRecommendation();
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error parsing recommendation:", error);
    return generateMockRecommendation();
  }
}

function generateMockRecommendation() {
  return {
    action: "BUY",
    entry_price: 43100,
    stop_loss: 42200,
    take_profit: 45000,
    position_size: "2.5%",
    confidence: 0.81,
    reasoning: "Technical breakout confirmed by macro tailwinds and positive sentiment narrative",
    signals: [
      "RSI above 60 indicating momentum",
      "MACD bullish crossover",
      "Price above 200-day moving average",
    ],
    risks: [
      "Potential Fed policy shift",
      "Resistance at 44,200 level",
      "High volatility environment",
    ],
  };
}

export default { analyzeWithLLM };
