/**
 * Standalone Benchmark Script
 * 
 * Run with: bun run benchmark.ts
 * 
 * Compares current text-based approach vs C2C KV-Cache projection
 */

import { compareApproaches, printResults } from "./src/benchmarks";

async function main() {
  console.log("🚀 Vibe Trade C2C Benchmark Suite");
  console.log("==================================");
  console.log("");

  // Simulate TAAPI response (technical indicators)
  const taapiResponse = JSON.stringify({
    symbol: "BTC",
    timeframe: "1h",
    indicators: {
      rsi: 65,
      macd: { status: "bullish_crossover" },
      moving_averages: { alignment: "aligned_uptrend" },
      bollinger_bands: { position: "neutral" },
      atr: 450,
    },
    pattern: "ascending_triangle",
    strength: 0.78,
    trend: "uptrend",
    support_resistance: {
      support: 42500,
      resistance: 44200,
      pivot: 43350,
    },
  });

  // Simulate AIXBT response (market sentiment)
  const aixbtResponse = JSON.stringify({
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
  });

  // Combine for full test data
  const testData = taapiResponse + aixbtResponse;

  console.log("📋 Test Data:");
  console.log(`  TAAPI response: ${taapiResponse.length} chars`);
  console.log(`  AIXBT response: ${aixbtResponse.length} chars`);
  console.log(`  Combined: ${testData.length} chars`);
  console.log("");

  // Run comparison
  try {
    const results = await compareApproaches(testData, 100);
    printResults(results);

    console.log("");
    console.log("📈 SUMMARY");
    console.log("──────────────────────────────────────────────────────────");
    console.log("");
    console.log("Current Approach (Text-Based):");
    console.log(`  • Serializes data to JSON`);
    console.log(`  • Sends as text to LLM router`);
    console.log(`  • LLM parses and processes`);
    console.log(`  • Latency: ${results.text_based.latency_ms.toFixed(2)}ms`);
    console.log("");

    console.log("C2C Approach (KV-Cache Projection):");
    console.log(`  • Extracts KV-Cache from TAAPI/AIXBT`);
    console.log(`  • Projects directly to LLM router cache`);
    console.log(`  • No text parsing needed`);
    console.log(`  • Latency: ${results.c2c.latency_ms.toFixed(2)}ms`);
    console.log("");

    console.log("🎯 Next Steps:");
    console.log("  1. Integrate C2C into agent.ts");
    console.log("  2. Test with real TAAPI/AIXBT data");
    console.log("  3. Measure production latency");
    console.log("  4. If promising, train custom projectors on cloud GPU");
    console.log("");
  } catch (error) {
    console.error("❌ Benchmark failed:", error);
    process.exit(1);
  }
}

main();
