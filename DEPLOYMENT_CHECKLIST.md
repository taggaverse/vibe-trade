# Vibe Trade - Railway Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Status
- [x] All source files in root `/src` directory
- [x] `package.json` at root level
- [x] `tsconfig.json` configured
- [x] `bun.lock` committed
- [x] `railway.json` configured
- [x] `.railwayignore` optimized

### Recent Changes
- [x] Multi-exchange integration added
- [x] Perpetuals endpoint enhanced
- [x] TAAPI indicators module created
- [x] Exchange data fetching module created
- [x] All changes committed to GitHub

### Environment Variables Ready
You'll need these in Railway:
```
PRIVATE_KEY = 0x...your_wallet_private_key...
TAAPI_API_KEY = your_taapi_api_key
OPENAI_API_KEY = sk-...your_openai_key...
```

Optional:
```
AIXBT_ENDPOINT = https://api.aixbt.tech/x402/agents/indigo
PAY_TO = 0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429
NETWORK = base
FACILITATOR_URL = https://facilitator.daydreams.systems
```

---

## 🚀 Deployment Steps

### Step 1: Go to Railway Dashboard
```
https://railway.app
```

### Step 2: Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Authorize Railway to access GitHub

### Step 3: Select Repository
- Search for `taggaverse/vibe-trade`
- Click to select
- Click "Deploy"

**Railway will auto-detect Bun and start building**

### Step 4: Add Environment Variables
While building, go to "Variables" tab and add:

**Required:**
```
PRIVATE_KEY = 0x...
TAAPI_API_KEY = ...
OPENAI_API_KEY = sk-...
```

**Mark as Protected:**
- Click lock icon on `PRIVATE_KEY`
- Click lock icon on `OPENAI_API_KEY`

### Step 5: Wait for Build
- Watch "Deployments" tab
- Build takes ~5-10 minutes
- Look for "Deployment successful"

### Step 6: Test Endpoints

**Get Agent Manifest:**
```bash
curl https://vibe-trade-production.railway.app/.well-known/agent.json
```

**Test Analyze Endpoint:**
```bash
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {"symbol": "BTC", "timeframe": "1h"}
  }'
```

**Test Perpetuals Endpoint:**
```bash
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "perps-funding",
    "input": {"markets": ["BTC", "ETH"], "include_technicals": true}
  }'
```

---

## 📊 What's Deployed

### Core Features
- ✅ AI-powered trading intelligence
- ✅ Multi-exchange technical analysis
- ✅ Perpetuals funding data
- ✅ x402 payment support
- ✅ C2C cache optimization
- ✅ Training data collection

### Endpoints
1. **`/analyze`** - Market analysis with technicals + sentiment
2. **`/perps-funding`** - Perpetuals funding with multi-exchange technicals
3. **`/collection-status`** - Training data progress

### Data Sources
- TAAPI (200+ indicators, 8+ exchanges)
- AIXBT (market sentiment)
- Hyperliquid (perpetuals funding)
- Multi-exchange comparison

---

## 🔧 Monitoring

### View Logs
```bash
npm install -g @railway/cli
railway login
railway logs
```

### Check Metrics
- Go to Railway dashboard
- Click "Metrics" tab
- Monitor CPU, memory, network

### Set Up Alerts
- Go to "Settings" → "Alerts"
- Create alerts for:
  - Memory > 80%
  - CPU > 80%
  - Restarts > 3 in 1 hour

---

## 🐛 Troubleshooting

### Build Fails
1. Check `package.json` has `"engines": { "bun": ">=1.1.0" }`
2. Verify `railway.json` exists
3. Click "Redeploy"

### 502 Bad Gateway
1. Check all env vars are set
2. Verify PRIVATE_KEY is valid
3. Check TAAPI_API_KEY is correct
4. Review logs for errors

### x402 Payments Failing
1. Verify PRIVATE_KEY is set
2. Check wallet has USDC on Base
3. Verify OPENAI_API_KEY is valid

---

## 📈 Performance Expected

**Analyze Endpoint:**
- TAAPI call: ~250ms
- AIXBT call: ~280ms
- Hyperliquid call: ~200ms
- Total: ~280ms (parallel)

**Perps-Funding Endpoint:**
- Hyperliquid: ~200ms
- Multi-exchange technicals: ~400-500ms
- Total: ~600-700ms

---

## 💰 Cost

- **Free tier:** $5/month (testing)
- **Pro tier:** ~$36/month (24/7 production)

---

## ✨ You're Ready!

Everything is configured and ready to deploy. Follow the 6 steps above and your agent will be live!

**Your public URL will be:**
```
https://vibe-trade-production.railway.app
```

---

**Last Updated:** November 5, 2025  
**Status:** ✅ Ready for Deployment
