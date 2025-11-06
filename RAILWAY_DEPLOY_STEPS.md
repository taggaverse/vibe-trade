# Railway Deployment - Step by Step

## 🎯 Quick Summary

Deploy Vibe Trade to Railway in 5 minutes:

1. Connect GitHub repo
2. Add environment variables
3. Deploy
4. Test endpoints
5. Done!

---

## 📋 Prerequisites

Before you start, have these ready:

- ✅ GitHub account (with vibe-trade repo pushed)
- ✅ Railway account (free at railway.app)
- ✅ PRIVATE_KEY (wallet for x402 payments)
- ✅ TAAPI_API_KEY (from taapi.io)
- ✅ OPENAI_API_KEY (from openai.com)

---

## 🚀 Step 1: Connect GitHub to Railway

### 1.1 Go to Railway
- Open https://railway.app
- Click "Start a New Project" (or "New Project" if logged in)

### 1.2 Select GitHub
- Click "Deploy from GitHub repo"
- Click "Authorize Railway" (if prompted)
- Select your GitHub account

### 1.3 Select Repository
- Find and click `taggaverse/vibe-trade`
- Click "Deploy"

**Expected:** Railway starts building automatically

---

## 🔧 Step 2: Add Environment Variables

### 2.1 Go to Variables
- In Railway dashboard, click "Variables" tab
- You'll see a form to add environment variables

### 2.2 Add Required Variables

Add these variables one by one:

```
PRIVATE_KEY = 0x...your_wallet_private_key...
TAAPI_API_KEY = your_taapi_api_key_here
OPENAI_API_KEY = sk-...your_openai_key...
```

### 2.3 Add Optional Variables

```
AIXBT_ENDPOINT = https://api.aixbt.tech/x402/agents/indigo
PAY_TO = 0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429
NETWORK = base
FACILITATOR_URL = https://facilitator.daydreams.systems
```

### 2.4 Mark Sensitive Variables
- Click the lock icon next to `PRIVATE_KEY`
- Click the lock icon next to `OPENAI_API_KEY`
- This prevents them from being logged

**Result:** All variables added and secured

---

## 📦 Step 3: Monitor Build

### 3.1 Watch Build Progress
- Click "Deployments" tab
- Watch the build logs in real-time

**Expected build steps:**
```
[1/5] Building environment...
[2/5] Installing dependencies...
[3/5] Building application...
[4/5] Starting server...
[5/5] Deployment complete!
```

### 3.2 Build Should Complete
- Takes ~5-10 minutes
- Watch for "Deployment successful"
- Railway provides a public URL

**Example URL:**
```
https://vibe-trade-production.railway.app
```

---

## ✅ Step 4: Test Deployment

### 4.1 Get Your URL
- Go to "Settings" tab
- Find "Domains" section
- Copy the Railway-provided URL

### 4.2 Test Agent Manifest

```bash
curl https://vibe-trade-production.railway.app/.well-known/agent.json
```

**Expected response:**
```json
{
  "name": "vibe-trade",
  "description": "AI-Powered Trading Intelligence",
  "endpoints": [...]
}
```

### 4.3 Test Analyze Endpoint

```bash
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {
      "symbol": "BTC",
      "timeframe": "1h"
    }
  }'
```

**Expected response:**
```json
{
  "output": {
    "symbol": "BTC",
    "analysis": {
      "technical": {...},
      "sentiment": {...},
      "recommendation": {...}
    }
  }
}
```

### 4.4 Test Perpetuals Endpoint

```bash
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "perps-funding",
    "input": {
      "markets": ["BTC", "ETH"]
    }
  }'
```

**Expected response:**
```json
{
  "output": {
    "venue": "hyperliquid",
    "markets": [
      {
        "symbol": "BTC",
        "funding_rate": -0.0000125,
        "time_to_next": 1800000,
        "open_interest": 688.11,
        "skew": 1.05
      }
    ]
  }
}
```

---

## 🎯 Step 5: Verify Everything Works

### 5.1 Check Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

**Look for:**
```
[vibe-trade] C2C Manager initialized with projectors
[vibe-trade] Training Data Collector initialized
🚀 Agent ready at http://...
```

### 5.2 Monitor Metrics

- Go to "Metrics" tab in Railway
- Watch CPU, memory, network
- Should be low usage

### 5.3 Check for Errors

- Go to "Logs" tab
- Search for "error" or "failed"
- Should see no errors

---

## 🐛 Troubleshooting

### Build Fails - "Bun not found"

**Solution:**
1. Check `package.json` has `"engines": { "bun": ">=1.1.0" }`
2. Verify `railway.json` exists
3. Click "Redeploy" in Railway

### Build Fails - "Missing dependencies"

**Solution:**
1. Run `bun install` locally
2. Commit `bun.lock`
3. Push to GitHub
4. Click "Redeploy"

### Server Starts but Returns 502

**Solution:**
1. Check all environment variables are set
2. Verify PRIVATE_KEY is valid
3. Check TAAPI_API_KEY is correct
4. Review logs for errors

### x402 Payments Failing

**Solution:**
1. Verify PRIVATE_KEY is set
2. Check wallet has USDC on Base
3. Verify OPENAI_API_KEY is valid
4. Check facilitator URL is accessible

---

## 📊 Monitor Your Deployment

### View Live Logs

```bash
railway logs --tail 50
```

### Check Metrics

```bash
railway status
```

### View Deployments

```bash
railway deployments
```

---

## 🔄 Update Your Deployment

### Make Changes Locally

```bash
# Edit code
# Test locally: bun run dev

# Commit and push
git add -A
git commit -m "Update agent logic"
git push origin main
```

### Railway Auto-Redeploys

- Railway automatically detects changes
- Starts new build
- Deploys new version
- Old version stays available for rollback

---

## 💾 Backup & Rollback

### View All Deployments

1. Go to Railway dashboard
2. Click "Deployments" tab
3. See all previous deployments

### Rollback to Previous Version

1. Find the deployment you want
2. Click "Redeploy"
3. Railway restores that version

---

## 🔐 Security Checklist

- [ ] PRIVATE_KEY marked as "Protected"
- [ ] OPENAI_API_KEY marked as "Protected"
- [ ] No sensitive data in logs
- [ ] HTTPS enabled (automatic)
- [ ] Wallet has limited USDC balance
- [ ] Monitor transactions on Basescan

---

## 📈 Performance Tips

### Reduce Build Time
- `.railwayignore` excludes unnecessary files
- Build cache speeds up subsequent deploys
- Takes ~5-10 minutes first time, ~2-3 minutes after

### Reduce Memory Usage
- Agent uses ~200-300MB RAM
- Railway provides 512MB (plenty)
- Monitor in "Metrics" tab

### Improve Response Time
- Parallel data fetching (280ms)
- C2C optimization (47% faster)
- Hyperliquid free API (no latency)

---

## 💰 Cost

### Free Tier
- $5 monthly credit
- Good for testing
- Auto-sleeps after 7 days

### Pro Tier (Recommended)
- Pay-as-you-go
- ~$0.05/hour for 512MB RAM
- ~$36/month for 24/7 uptime
- No auto-sleep

---

## ✨ You're Done!

Your agent is now live on Railway!

**Your public URL:**
```
https://vibe-trade-production.railway.app
```

**Next steps:**
1. Share URL with users
2. Monitor logs and metrics
3. Update code as needed
4. Scale if needed

---

## 📞 Need Help?

### Railway Support
- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### Vibe Trade Support
- [GitHub Issues](https://github.com/taggaverse/vibe-trade/issues)
- [Documentation](./docs/)

---

**Deployment Time:** ~15 minutes  
**Status:** ✅ Ready to Deploy!
