# Railway Deployment - Quick Start Card

## ✅ Fixed: Repository Restructured for Railway

The agent code has been moved to the root directory. Railway will now correctly detect and build the Bun project.

## 🚀 Deploy in 5 Steps

### Step 1: Go to Railway
```
https://railway.app → New Project → Deploy from GitHub
```

### Step 2: Select Repository
```
Select: taggaverse/vibe-trade
Click: Deploy
```

### Step 3: Add Environment Variables
```
PRIVATE_KEY = 0x...your_wallet_key...
TAAPI_API_KEY = your_taapi_key
OPENAI_API_KEY = sk-...your_openai_key...
```

### Step 4: Wait for Build
```
Watch Deployments tab
Build takes ~5-10 minutes
Look for "Deployment successful"
```

### Step 5: Test
```bash
curl https://vibe-trade-production.railway.app/.well-known/agent.json
```

---

## 📋 Environment Variables

**Required:**
```
PRIVATE_KEY = 0x...
TAAPI_API_KEY = ...
OPENAI_API_KEY = sk-...
```

**Optional:**
```
AIXBT_ENDPOINT = https://api.aixbt.tech/x402/agents/indigo
PAY_TO = 0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429
NETWORK = base
FACILITATOR_URL = https://facilitator.daydreams.systems
```

---

## 🧪 Test Endpoints

### Agent Manifest
```bash
curl https://vibe-trade-production.railway.app/.well-known/agent.json
```

### Analyze
```bash
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{"entrypoint": "analyze", "input": {"symbol": "BTC", "timeframe": "1h"}}'
```

### Perpetuals Funding
```bash
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{"entrypoint": "perps-funding", "input": {"markets": ["BTC", "ETH"]}}'
```

---

## 🔧 Monitor

### View Logs
```bash
npm install -g @railway/cli
railway login
railway logs
```

### Check Status
```bash
railway status
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Build fails - "Bun not found" | Check `package.json` has `"engines": { "bun": ">=1.1.0" }` |
| Build fails - "Missing deps" | Run `bun install` locally, commit `bun.lock`, push |
| 502 Bad Gateway | Check all env vars set, verify PRIVATE_KEY valid |
| x402 payments fail | Verify PRIVATE_KEY set, check wallet has USDC |

---

## 💰 Cost

- **Free tier:** $5/month (testing)
- **Pro tier:** ~$36/month (24/7 production)

---

## 📚 Full Guides

- [Detailed Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [Step-by-Step Instructions](./RAILWAY_DEPLOY_STEPS.md)
- [Main README](./README.md)

---

**Ready to deploy? Follow the 5 steps above!**
