# Vibe Trade - AI-Powered Trading Intelligence Nanoservice

A Bun-based x402 nanoservice that provides intelligent trading analysis by combining multiple data sources.

## Architecture

**Vibe Trade** is a Dreams agent that:
- Receives x402 payments from clients ($0.10 USDC)
- Intelligently routes requests using LLM
- Calls TAAPI (technical indicators) and AIXBT (market sentiment) in parallel
- Returns aggregated trading analysis
- Spends up to 90% of received payment on data sources

## Quick Start

```bash
cd dreams
bun install
bun run dev
```

Agent will be available at: `http://localhost:8787/.well-known/agent.json`

## Configuration

Create `dreams/.env` with:

```env
PRIVATE_KEY=0x...              # Wallet for x402 payments
TAAP_API_KEY=your_key          # TAAPI standard API key
OPENAI_API_KEY=sk-...          # For routing decisions
PAY_TO=0x...                   # Where client payments go
```

## Data Sources

- **TAAPI** - Technical indicators (RSI, MACD, Bollinger Bands, ATR, etc.)
- **AIXBT** - Market sentiment, narratives, whale activity
- **Dreams LLM** - Intelligent routing and analysis

## Deployment

Deploy to any Bun-compatible platform:
- Railway
- Heroku
- AWS Lambda
- DigitalOcean

## Project Structure

- `/dreams` - Main Bun agent application
  - `src/agent.ts` - Agent definition and entrypoints
  - `src/index.ts` - HTTP server
  - `.env.example` - Configuration template
