# Vibe Trade - Testing Guide

## 🧪 Testing Your Deployed Agent

Your agent is deployed at:
```
https://web-production-5dad2.up.railway.app/
```

### Step 1: Check Agent Manifest

First, verify the agent is running:

```bash
curl https://web-production-5dad2.up.railway.app/.well-known/agent.json
```

This should return the agent manifest with all endpoints.

---

## 📝 Testing Endpoints

### Option A: Using cURL (Command Line)

**Test Analyze Endpoint:**
```bash
curl -X POST https://web-production-5dad2.up.railway.app/ \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {
      "symbol": "BTC",
      "timeframe": "1h"
    }
  }'
```

**Test Perps-Funding Endpoint:**
```bash
curl -X POST https://web-production-5dad2.up.railway.app/ \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "perps-funding",
    "input": {
      "markets": ["BTC", "ETH"],
      "include_technicals": true
    }
  }'
```

**Test Collection Status:**
```bash
curl -X POST https://web-production-5dad2.up.railway.app/ \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "collection-status",
    "input": {}
  }'
```

---

### Option B: Using Postman

1. Create new POST request
2. URL: `https://web-production-5dad2.up.railway.app/`
3. Headers:
   ```
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "entrypoint": "analyze",
     "input": {
       "symbol": "BTC",
       "timeframe": "1h"
     }
   }
   ```
5. Click Send

---

### Option C: Using JavaScript/Node.js

```javascript
const response = await fetch('https://web-production-5dad2.up.railway.app/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    entrypoint: 'analyze',
    input: {
      symbol: 'BTC',
      timeframe: '1h'
    }
  })
});

const data = await response.json();
console.log(data);
```

---

### Option D: Using Python

```python
import requests
import json

url = 'https://web-production-5dad2.up.railway.app/'
headers = {'Content-Type': 'application/json'}
payload = {
    'entrypoint': 'analyze',
    'input': {
        'symbol': 'BTC',
        'timeframe': '1h'
    }
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

---

## 🔍 Troubleshooting

### Issue: "404 Not Found"

**Cause:** Wrong endpoint path

**Solution:** 
- Use: `https://web-production-5dad2.up.railway.app/`
- NOT: `https://web-production-5dad2.up.railway.app/analyze`
- NOT: `https://web-production-5dad2.up.railway.app/invoke`

The agent uses a single POST endpoint that routes based on the `entrypoint` field in the request body.

### Issue: "400 Bad Request"

**Cause:** Missing or incorrect request format

**Solution:**
- Ensure `Content-Type: application/json` header
- Ensure body has `entrypoint` and `input` fields
- Ensure `input` matches the endpoint's schema

### Issue: "500 Internal Server Error"

**Cause:** Agent error processing request

**Solution:**
1. Check Railway logs:
   ```bash
   railway logs
   ```
2. Verify environment variables are set:
   - `PRIVATE_KEY`
   - `TAAPI_API_KEY`
   - `OPENAI_API_KEY`

### Issue: "Timeout"

**Cause:** Request taking too long

**Solution:**
- Perps-funding with technicals can take 600-700ms
- Analyze endpoint can take 280ms
- Increase timeout in your client

---

## 📊 Expected Responses

### Analyze Endpoint Response

```json
{
  "output": {
    "symbol": "BTC",
    "analysis": {
      "technical": {
        "rsi": 65,
        "macd": {...},
        "sma": {...},
        "ema": {...},
        "bbands": {...},
        "atr": {...}
      },
      "sentiment": {
        "sentiment": "bullish",
        "confidence": 0.85,
        "narrative": "..."
      },
      "perpetuals": {
        "funding_rate": 0.00012,
        "open_interest": 688.11,
        "mark_price": 42500,
        "oracle_price": 42480,
        "premium": 0.047,
        "day_volume": 15234000,
        "funding_summary": "..."
      },
      "recommendation": {
        "action": "BUY",
        "confidence": 0.85,
        "funding_signal": "LONG",
        "funding_strength": 0.7,
        "signal_agreement": 0.95,
        "time_to_next_funding_ms": 1800000,
        "reasoning": "..."
      }
    },
    "metadata": {
      "sources_called": ["TAAPI", "AIXBT", "Hyperliquid-Perps"],
      "total_cost": "90000",
      "processing_time_ms": 280
    }
  },
  "model": "vibe-trade-v1"
}
```

### Perps-Funding Endpoint Response

```json
{
  "output": {
    "venue": "hyperliquid",
    "markets": [
      {
        "symbol": "BTC",
        "funding_rate": 0.00012,
        "time_to_next": 3600000,
        "open_interest": 688.11,
        "skew": 1.05,
        "mark_price": 42500,
        "oracle_price": 42480,
        "premium": 0.047,
        "day_volume": 15234000,
        "timestamp": 1730800000,
        "technicals": {
          "exchanges": [
            {
              "exchange": "binancefutures",
              "price": 42500,
              "volume": 1250000,
              "rsi": 65,
              "macd": {...},
              "bbands": {...}
            }
          ],
          "analysis": {
            "price_spread": 0.023,
            "signal_agreement": 0.95,
            "recommendation": "SHORT"
          }
        }
      }
    ],
    "timestamp": 1730800000,
    "total_markets": 1,
    "metadata": {
      "timeframe": "1h",
      "exchanges_queried": ["binancefutures", "bybit"],
      "includes_technicals": true
    }
  },
  "model": "vibe-trade-v1"
}
```

---

## 🔧 Debugging

### View Agent Logs

```bash
npm install -g @railway/cli
railway login
railway logs --tail 50
```

### Check Environment Variables

In Railway dashboard:
1. Go to your project
2. Click "Variables" tab
3. Verify all required variables are set:
   - `PRIVATE_KEY` ✓
   - `TAAPI_API_KEY` ✓
   - `OPENAI_API_KEY` ✓

### Test Locally

```bash
cd /Users/alectaggart/CascadeProjects/windsurf-project-2
bun run dev
```

Then test against `http://localhost:8787/`

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 404 Not Found | Use POST to `/` not `/analyze` |
| 400 Bad Request | Check JSON format and required fields |
| 500 Error | Check logs and environment variables |
| Timeout | Increase client timeout, check Railway logs |
| No response | Check if agent is running: `railway logs` |

---

## ✅ Quick Test Checklist

- [ ] Agent manifest loads: `/.well-known/agent.json`
- [ ] Analyze endpoint responds
- [ ] Perps-funding endpoint responds
- [ ] Collection-status endpoint responds
- [ ] Response times are reasonable
- [ ] No errors in Railway logs

---

**Status:** Ready for Testing!
