import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "Vibe Trade",
    version: "1.0.0",
    timestamp: Date.now(),
  });
});

// API docs
app.get("/api/docs", (req: Request, res: Response) => {
  res.json({
    service: "Vibe Trade - AI Trading Intelligence API",
    version: "1.0.0",
    description: "Professional trading analysis with x402 micropayments",
    endpoints: {
      "GET /health": "Health check",
      "GET /api/docs": "API documentation",
      "POST /api/v1/trading-analysis": "Single asset analysis",
      "POST /api/v1/bulk-analysis": "Multiple assets analysis",
    },
    payment: {
      protocol: "x402",
      network: process.env.X402_NETWORK || "base-sepolia",
      currency: "USDC",
      prices: {
        single_analysis: "$0.10",
        bulk_analysis: "$0.05 per symbol",
      },
    },
  });
});

// Status endpoint
app.get("/api/v1/status", (req: Request, res: Response) => {
  res.json({
    service: "Vibe Trade",
    status: "operational",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Trading analysis endpoint (placeholder)
app.post("/api/v1/trading-analysis", (req: Request, res: Response) => {
  const { symbol, timeframe } = req.body;

  if (!symbol || !timeframe) {
    return res.status(400).json({
      error: "Missing required fields",
      code: "INVALID_REQUEST",
      details: "symbol and timeframe are required",
      timestamp: Date.now(),
    });
  }

  // Check for x402 payment
  const xPayment = req.headers["x-payment"];
  if (!xPayment) {
    return res.status(402).json({
      error: "Payment Required",
      code: "PAYMENT_REQUIRED",
      payment_required: {
        amount: "100000",
        currency: "USDC",
        network: process.env.X402_NETWORK || "base-sepolia",
        recipient: process.env.X402_RECIPIENT_ADDRESS || "0x0000000000000000000000000000000000000000",
        description: "Trading analysis request",
      },
      timestamp: Date.now(),
    });
  }

  // Mock analysis response
  res.json({
    analysis: {
      technical: {
        indicators: {
          rsi: 65,
          macd: { status: "bullish_crossover" },
          moving_averages: { alignment: "aligned_uptrend" },
        },
        pattern: "ascending_triangle",
        strength: 0.78,
        trend: "uptrend",
      },
      sentiment: {
        market_sentiment: "bullish",
        narrative: "Fed pivot expectations",
        confidence: 0.72,
      },
      macro: {
        environment: "risk_on",
        impact: "high",
      },
      recommendation: {
        action: "BUY",
        entry_price: 43100,
        stop_loss: 42200,
        take_profit: 45000,
        position_size: "2.5%",
        confidence: 0.81,
        reasoning: "Technical breakout confirmed by macro tailwinds",
      },
    },
    metadata: {
      timestamp: Date.now(),
      request_id: `REQ_${Date.now()}`,
      processing_time_ms: 250,
      data_sources: ["TAAPI", "AIXBT", "Macro", "Dreams LLM"],
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    code: "NOT_FOUND",
    details: `Endpoint ${req.method} ${req.path} not found`,
    timestamp: Date.now(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Vibe Trade API server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api/docs`);
});

export default app;
