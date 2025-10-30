// Type definitions for Vibe Trade

export interface TradingAnalysisRequest {
  symbol: string;
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
  analysis_type?: "quick" | "standard" | "deep";
  include_execution?: boolean;
}

export interface TradingRecommendation {
  action: "BUY" | "SELL" | "HOLD";
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  position_size: string;
  confidence: number;
  reasoning: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp: number;
}
