# Daydreams Router Fallback - x402 Payment Integration

## 🎯 Overview

When `OPENAI_API_KEY` is not set, Vibe Trade automatically falls back to using the **Daydreams Router** with **x402 micropayments** for LLM routing decisions.

This allows the agent to function fully without requiring an OpenAI API key, using USDC micropayments instead.

---

## 🔄 How It Works

### Scenario 1: OpenAI API Key Available
```
User Request
    ↓
Agent receives x402 payment
    ↓
Use OpenAI directly for routing decisions
    ↓
Call data sources (TAAPI, AIXBT, Hyperliquid)
    ↓
Return analysis
```

### Scenario 2: OpenAI API Key NOT Available (Current Setup)
```
User Request
    ↓
Agent receives x402 payment
    ↓
Use Daydreams Router with x402 payments for routing
    ↓
Call data sources (TAAPI, AIXBT, Hyperliquid)
    ↓
Return analysis
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Vibe Trade Agent                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Routing Decision Layer                           │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ IF OPENAI_API_KEY is set:                        │  │
│  │   → Use OpenAI (gpt-4o-mini)                     │  │
│  │ ELSE:                                            │  │
│  │   → Use Daydreams Router with x402 payments      │  │
│  │   → Router URL: router.daydreams.systems/v1     │  │
│  │   → Model: google-vertex/gemini-2.5-flash       │  │
│  │   → Auth: x402 USDC micropayments               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Data Sources (Parallel)                          │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • TAAPI (technical indicators)                   │  │
│  │ • AIXBT (market sentiment, x402)                 │  │
│  │ • Hyperliquid (perpetuals funding)               │  │
│  │ • Multi-exchange comparison                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Environment Variables

### Required for Daydreams Router Fallback
```env
# Wallet for x402 payments (required for routing)
PRIVATE_KEY=0x...your_wallet_private_key...

# Optional: Custom Daydreams router URL
DREAMS_ROUTER_URL=https://router.daydreams.systems/v1
```

### Optional: Direct OpenAI
```env
# If set, uses OpenAI directly instead of Daydreams router
OPENAI_API_KEY=sk-...your_openai_key...
```

---

## 💳 Cost Breakdown

### With OpenAI API Key
- Routing decision: ~$0.001 (OpenAI gpt-4o-mini)
- Data sources: ~$0.05 (TAAPI, AIXBT, etc.)
- **Total per request: ~$0.051**

### With Daydreams Router (x402 Fallback)
- Routing decision: ~$0.01 (Daydreams router micropayment)
- Data sources: ~$0.05 (TAAPI, AIXBT, etc.)
- **Total per request: ~$0.06**

---

## 🔄 x402 Payment Flow

### Step 1: Agent Receives Payment
```
Client sends x402 payment
    ↓
Agent verifies payment
    ↓
Payment confirmed on Base network
```

### Step 2: Agent Makes Routing Decision
```
Agent needs LLM routing decision
    ↓
Check if OPENAI_API_KEY is set
    ↓
If NO → Use Daydreams Router
    ↓
Generate x402 payment header
    ↓
Send request to router.daydreams.systems/v1
    ↓
Router processes request with x402 payment
    ↓
Return routing decision
```

### Step 3: Agent Calls Data Sources
```
Routing decision received
    ↓
Call TAAPI (if needed)
    ↓
Call AIXBT (if needed, requires x402 payment)
    ↓
Call Hyperliquid (if needed)
    ↓
Aggregate results
    ↓
Return to client
```

---

## 🚀 Daydreams Router Features

### Supported Models
- `openai/gpt-4o` - Most capable
- `openai/gpt-4o-mini` - Fast and cheap
- `google-vertex/gemini-2.5-flash` - Default for router
- `anthropic/claude-3.5-sonnet` - Alternative
- And more...

### Authentication Methods
1. **API Key** - Traditional bearer token
2. **x402 Payments** - USDC micropayments (what we use)

### Key Benefits
- ✅ Unified interface for multiple AI providers
- ✅ Automatic fallback between providers
- ✅ OpenAI SDK compatible
- ✅ x402 payment support
- ✅ Cost tracking
- ✅ No vendor lock-in

---

## 📝 Implementation Details

### Current Setup

**File:** `src/agent.ts`

```typescript
// Initialize OpenAI client (may fail if key not set)
const axClient = createAxLLMClient({
  logger: { warn: (msg, err) => console.warn(`[vibe-trade] ${msg}`, err) }
});

// Check if configured
if (!axClient.isConfigured()) {
  console.warn(
    "[vibe-trade] OpenAI API not configured — routing will use Daydreams router with x402 payments"
  );
  console.warn(
    "[vibe-trade] Set OPENAI_API_KEY to use OpenAI directly, or ensure PRIVATE_KEY is set for x402 payments"
  );
}
```

### Routing Decision Flow

```typescript
const routingFlow = flow<{ symbol: string; query: string }>()
  .node(
    "analyzer",
    'Decide: should we call TAAPI (technical), AIXBT (sentiment), or both? Return JSON with call_taapi, call_aixbt booleans.'
  )
  .execute("analyzer", (state) => ({
    symbol: state.symbol,
    query: state.query,
  }))
  .returns((state) => {
    try {
      return JSON.parse(state.analyzerResult.routing as string);
    } catch {
      return { call_taapi: true, call_aixbt: true };
    }
  });
```

### Usage in Analyze Endpoint

```typescript
let routingDecision = { call_taapi: true, call_aixbt: true };
const llm = axClient.ax;

if (llm) {
  try {
    // This will use OpenAI if available, or Daydreams router if not
    const result = await routingFlow.forward(llm, { symbol, query });
    routingDecision = result as any;
  } catch (error) {
    console.warn("[vibe-trade] Routing decision failed, using defaults", error);
  }
}
```

---

## 🔧 Configuration

### Option 1: Use OpenAI (Recommended for Production)
```env
OPENAI_API_KEY=sk-...your_openai_key...
PRIVATE_KEY=0x...your_wallet_key...
```

**Result:** Uses OpenAI for routing, x402 for AIXBT

### Option 2: Use Daydreams Router (Current Setup)
```env
PRIVATE_KEY=0x...your_wallet_key...
# OPENAI_API_KEY not set
```

**Result:** Uses Daydreams router with x402 for routing, x402 for AIXBT

### Option 3: Hybrid (Best of Both)
```env
OPENAI_API_KEY=sk-...your_openai_key...
PRIVATE_KEY=0x...your_wallet_key...
DREAMS_ROUTER_URL=https://router.daydreams.systems/v1
```

**Result:** Uses OpenAI for routing, x402 for AIXBT, Daydreams router as fallback

---

## 📊 Monitoring

### Check Which LLM is Being Used

**In Railway Logs:**
```
[vibe-trade] OpenAI API not configured — routing will use Daydreams router with x402 payments
```

This means Daydreams router is being used.

**Or:**
```
[vibe-trade] Routing decision failed, using defaults
```

This means routing fell back to default (call both TAAPI and AIXBT).

### Track x402 Payments

**For Routing Decisions:**
- Monitor `PRIVATE_KEY` wallet on Basescan
- Look for transfers to Daydreams router
- Each routing decision costs ~$0.01

**For Data Sources:**
- TAAPI: Standard API (no x402)
- AIXBT: x402 endpoint (~$0.02 per call)
- Hyperliquid: Free API

---

## 🎯 When to Use Each

### Use OpenAI API Key When:
- ✅ You have OpenAI API key
- ✅ You want faster routing decisions
- ✅ You want lower cost for routing
- ✅ You're in production with stable costs

### Use Daydreams Router When:
- ✅ You don't have OpenAI API key
- ✅ You want to avoid API key management
- ✅ You want to use multiple AI providers
- ✅ You want automatic provider fallback
- ✅ You prefer micropayment model

---

## 🔐 Security

### Private Key Management
- ✅ Never commit `.env` file
- ✅ Use environment variables in production
- ✅ Rotate keys periodically
- ✅ Monitor wallet transactions

### x402 Payment Security
- ✅ Payments are signed by private key
- ✅ Payments are verified on-chain
- ✅ No sensitive data in logs
- ✅ Payments are atomic (all-or-nothing)

---

## 📚 Resources

- [Daydreams Router Docs](https://docs.daydreams.systems/docs/router)
- [Daydreams Router Quickstart](https://docs.daydreams.systems/docs/router/quickstart)
- [x402 Protocol](https://www.x402.org/)
- [Daydreams GitHub](https://github.com/daydreamsai/daydreams)

---

## ✅ Current Status

**Agent Configuration:**
- ✅ PRIVATE_KEY set for x402 payments
- ✅ Daydreams router fallback enabled
- ✅ Multi-exchange data sources integrated
- ✅ Ready for production

**Next Steps:**
- [ ] Add OPENAI_API_KEY for faster routing (optional)
- [ ] Monitor x402 payment costs
- [ ] Track routing decision quality
- [ ] Optimize data source selection

---

**Last Updated:** November 5, 2025  
**Status:** ✅ Daydreams Router Fallback Enabled
