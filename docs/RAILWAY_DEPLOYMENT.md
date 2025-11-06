# Railway Deployment Guide for Vibe Trade

## 🎯 Overview

This guide walks through deploying Vibe Trade to Railway step-by-step. Railway automatically detects Bun projects and deploys them with minimal configuration.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with vibe-trade repository
- ✅ Railway account (free tier available at railway.app)
- ✅ All environment variables ready
- ✅ Base wallet funded with USDC (for x402 payments)

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select `taggaverse/vibe-trade` repository
6. Click "Deploy"

**Expected:** Railway detects Bun and starts building

### Step 2: Configure Environment Variables

Railway will prompt you to add environment variables. Add all required variables:

```env
# Base Network (x402 Payments)
BASE_RPC_URL=https://mainnet.base.org
BASE_PRIVATE_KEY=0x...

# API Keys
TAAPI_API_KEY=your_taapi_api_key
OPENAI_API_KEY=sk-...

# x402 Configuration
PAY_TO=0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429
NETWORK=base
FACILITATOR_URL=https://facilitator.daydreams.systems

# AIXBT
AIXBT_ENDPOINT=https://api.aixbt.tech/x402/agents/indigo

# Optional
DEBUG=false
```

**Important:** 
- Never commit `.env` to GitHub
- Use Railway's environment variable UI
- Mark sensitive variables as "Protected"

### Step 3: Verify Build Configuration

Railway should auto-detect the Bun project. The `railway.json` file handles:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 5
  }
}
```

**What this does:**
- Uses nixpacks builder (supports Bun)
- Runs `npm start` which executes `bun run src/index.ts`
- Restarts on failure (up to 5 times)

### Step 4: Monitor Build Process

1. Go to your Railway project dashboard
2. Click "Deployments" tab
3. Watch the build logs in real-time

**Expected build steps:**
```
[1/5] Building environment...
[2/5] Installing dependencies...
[3/5] Building application...
[4/5] Starting server...
[5/5] Deployment complete!
```

### Step 5: Verify Deployment

Once deployed, Railway provides a public URL:

```
https://vibe-trade-production.railway.app
```

**Test the agent:**

```bash
# Check agent manifest
curl https://vibe-trade-production.railway.app/.well-known/agent.json

# Test analyze endpoint
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {"symbol": "BTC", "timeframe": "1h"}
  }'
```

### Step 6: Set Up Monitoring

1. Go to Railway dashboard
2. Click "Monitoring" tab
3. Set up alerts for:
   - High memory usage
   - High CPU usage
   - Deployment failures
   - Restart events

---

## 🔧 Troubleshooting

### Issue: Build Fails - "Bun not found"

**Error:**
```
error: command not found: bun
```

**Solution:**
1. Check `package.json` has `"engines": { "bun": ">=1.1.0" }`
2. Ensure `railway.json` uses nixpacks builder
3. Rebuild: Click "Redeploy" in Railway dashboard

### Issue: Build Fails - "Missing dependencies"

**Error:**
```
error: could not resolve: "@lucid-dreams/agent-kit"
```

**Solution:**
1. Check `bun.lock` is committed to GitHub
2. Run `bun install` locally to update lock file
3. Commit and push: `git push origin main`
4. Redeploy in Railway

### Issue: Build Succeeds but Server Won't Start

**Error:**
```
error: Cannot find module "./agent"
```

**Solution:**
1. Check `src/index.ts` imports are correct
2. Verify `src/agent.ts` exists and exports `app`
3. Run locally: `bun run src/index.ts`
4. Check for TypeScript errors: `bun run typecheck`

### Issue: Server Starts but Returns 502 Bad Gateway

**Error:**
```
502 Bad Gateway
```

**Solution:**
1. Check Railway logs for errors
2. Verify environment variables are set
3. Check BASE_PRIVATE_KEY is valid
4. Verify wallet has USDC balance
5. Check TAAPI_API_KEY is valid

### Issue: x402 Payments Failing

**Error:**
```
[vibe-trade] Failed to initialize x402 client
```

**Solution:**
1. Verify BASE_PRIVATE_KEY is set in Railway
2. Check BASE_RPC_URL is correct
3. Verify wallet has USDC on Base
4. Check facilitator URL is accessible
5. Review logs: `railway logs`

---

## 📊 Monitoring Deployment

### View Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# View live logs
railway logs

# View specific service logs
railway logs --service vibe-trade
```

### Check Metrics

1. Go to Railway dashboard
2. Click "Metrics" tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Network I/O
   - Restart count

### Set Up Alerts

1. Go to "Settings" → "Alerts"
2. Create alerts for:
   - Memory > 80%
   - CPU > 80%
   - Restarts > 3 in 1 hour
   - Deployment failures

---

## 🔄 Deployment Updates

### Deploy New Changes

```bash
# Make changes locally
# Test: bun run dev

# Commit and push
git add -A
git commit -m "Update agent logic"
git push origin main

# Railway automatically redeploys
# Watch deployment in dashboard
```

### Rollback to Previous Version

1. Go to Railway dashboard
2. Click "Deployments" tab
3. Find previous successful deployment
4. Click "Redeploy"

---

## 🔐 Security Best Practices

### Environment Variables

✅ **DO:**
- Use Railway's environment variable UI
- Mark sensitive variables as "Protected"
- Rotate keys periodically
- Use dedicated wallet for payments

❌ **DON'T:**
- Commit `.env` to GitHub
- Share environment variables
- Use same wallet for other purposes
- Log sensitive data

### Network Security

✅ **DO:**
- Use HTTPS (Railway provides)
- Verify x402 payments on blockchain
- Monitor wallet transactions
- Set up rate limiting

❌ **DON'T:**
- Expose private keys in logs
- Use HTTP (only HTTPS)
- Trust unverified payments
- Allow unlimited requests

---

## 📈 Performance Optimization

### Reduce Build Time

1. Add `.railwayignore` to exclude files:
```
.git
.gitignore
node_modules
*.md
docs/
scripts/
```

2. Use Railway's build cache:
   - Caches `node_modules` between builds
   - Faster subsequent deployments

### Reduce Memory Usage

1. Set memory limit in `railway.json`:
```json
{
  "deploy": {
    "memoryLimit": "512MB"
  }
}
```

2. Monitor memory in Railway dashboard
3. Optimize code if needed

### Improve Response Time

1. Enable caching in agent
2. Optimize database queries
3. Use CDN for static assets
4. Monitor latency in metrics

---

## 💰 Railway Pricing

### Free Tier
- $5 monthly credit
- Sufficient for testing
- Auto-sleep after 7 days inactivity

### Pro Tier
- Pay-as-you-go ($0.10/hour per GB RAM)
- No auto-sleep
- Better for production
- Recommended for Vibe Trade

### Cost Estimation

**For Vibe Trade:**
- Memory: 512MB ($0.05/hour)
- Uptime: 24/7 = 730 hours/month
- **Monthly cost: ~$36.50**

---

## 🚀 Production Checklist

Before going live:

- [ ] All environment variables set in Railway
- [ ] BASE_PRIVATE_KEY configured
- [ ] Wallet funded with USDC
- [ ] TAAPI_API_KEY valid
- [ ] OPENAI_API_KEY valid
- [ ] Monitoring alerts configured
- [ ] Logs accessible via Railway CLI
- [ ] Domain configured (optional)
- [ ] SSL certificate active (automatic)
- [ ] Rate limiting configured (optional)

---

## 📞 Support & Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app/)
- [Bun on Railway](https://docs.railway.app/guides/bun)
- [Environment Variables](https://docs.railway.app/develop/variables)

### Vibe Trade Resources
- [GitHub Repository](https://github.com/taggaverse/vibe-trade)
- [Main README](../README.md)
- [x402 Payments Study](./X402_AUTONOMOUS_PAYMENTS_STUDY.md)
- [Base Wallet Setup](./BASE_WALLET_SETUP.md)

### Get Help
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub Issues: [Issues](https://github.com/taggaverse/vibe-trade/issues)
- Email: support@taggaverse.com

---

## ✅ Deployment Verification

### Test Endpoints

```bash
# 1. Check agent manifest
curl https://vibe-trade-production.railway.app/.well-known/agent.json

# 2. Test analyze endpoint
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {"symbol": "BTC", "timeframe": "1h"}
  }'

# 3. Check collection status
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "collection-status",
    "input": {}
  }'

# 4. Check perps funding
curl -X POST https://vibe-trade-production.railway.app \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "perps-funding",
    "input": {"markets": ["BTC", "ETH"]}
  }'
```

### Expected Responses

✅ **Agent Manifest:**
```json
{
  "name": "vibe-trade",
  "description": "AI-Powered Trading Intelligence",
  "endpoints": [...]
}
```

✅ **Analyze Response:**
```json
{
  "output": {
    "symbol": "BTC",
    "analysis": {...}
  }
}
```

---

## 🎯 Next Steps

1. ✅ Deploy to Railway
2. ✅ Verify all endpoints work
3. ✅ Monitor logs and metrics
4. ✅ Set up alerts
5. ✅ Configure custom domain (optional)
6. ✅ Scale if needed

---

**Status:** ✅ Deployment Guide Complete  
**Ready for:** Production deployment on Railway  
**Estimated Setup Time:** 15-30 minutes  

---

*Last Updated: November 5, 2025*  
*Framework: Bun + Daydreams + Railway*
