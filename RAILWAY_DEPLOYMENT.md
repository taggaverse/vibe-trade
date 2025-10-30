# Vibe Trade - Railway Deployment Guide

This guide walks you through deploying Vibe Trade to Railway.app.

## Prerequisites

- GitHub account with access to `https://github.com/taggaverse/vibe-trade`
- Railway.app account (free tier available)
- Environment variables configured

## Deployment Steps

### Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Search for and select `taggaverse/vibe-trade`
6. Authorize Railway to access your repository

### Step 2: Configure Environment Variables

In the Railway dashboard:

1. Go to your project
2. Click "Variables"
3. Add the following environment variables:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# x402 Payment
X402_RECIPIENT_ADDRESS=0x...
X402_NETWORK=base-sepolia
X402_PAYMENT_AMOUNT=100000

# API Keys (Optional for MVP)
TAAPI_API_KEY=your_key
AIXBT_API_KEY=your_key
DREAMS_API_KEY=your_key
HYPERLIQUID_PRIVATE_KEY=your_key

# Client Wallet
CLIENT_PRIVATE_KEY=your_key

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000
```

### Step 3: Deploy

1. Railway will automatically detect the `railway.json` and `Procfile`
2. Click "Deploy"
3. Wait for the build to complete (usually 2-3 minutes)
4. Once deployed, you'll get a public URL

### Step 4: Verify Deployment

Test your deployment:

```bash
# Replace YOUR_RAILWAY_URL with your actual Railway URL
curl https://YOUR_RAILWAY_URL/health

# Should return:
# {
#   "status": "healthy",
#   "service": "Vibe Trade",
#   "version": "1.0.0",
#   "timestamp": 1698624000000
# }
```

## Continuous Deployment

Railway automatically deploys when you push to the main branch:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Railway will automatically build and deploy
```

## Monitoring

In the Railway dashboard:

- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: View deployment history
- **Settings**: Configure custom domains, restart policies, etc.

## Custom Domain

To use a custom domain:

1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

Check the build logs in Railway dashboard. Common issues:

- Missing environment variables
- Node version incompatibility
- Missing dependencies

### Application Crashes

Check the application logs:

1. Go to project dashboard
2. Click "Logs"
3. Look for error messages

### Slow Performance

Check metrics:

1. Go to "Metrics" tab
2. Monitor CPU and memory usage
3. Consider upgrading plan if needed

## Scaling

Railway offers different plan tiers:

- **Free**: Limited resources, good for testing
- **Pro**: More resources, better for production
- **Enterprise**: Custom scaling and support

To upgrade:

1. Go to account settings
2. Click "Billing"
3. Select desired plan

## Rollback

To rollback to a previous deployment:

1. Go to "Deployments" tab
2. Find the deployment you want to rollback to
3. Click "Redeploy"

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Vibe Trade Docs: See README.md

---

**Deployment Status:** ✅ Ready for Railway

Your Vibe Trade service is now ready to deploy on Railway!
