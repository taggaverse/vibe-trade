# Debugging: INVOKE Button Not Clickable

## 🔍 Issue

The INVOKE button in the UI is not clickable and doesn't trigger a wallet payment prompt.

## 🎯 Root Causes & Solutions

### Cause 1: Agent Not Properly Registered

**Check:**
```bash
curl https://web-production-5dad2.up.railway.app/.well-known/agent.json
```

**Should return:**
```json
{
  "name": "vibe-trade",
  "version": "1.0.0",
  "description": "AI-powered trading intelligence...",
  "entrypoints": [
    {
      "key": "analyze",
      "description": "...",
      "price": "100000",
      "input": {...},
      "output": {...}
    }
  ]
}
```

**If not returning properly:**
- Check Railway logs: `railway logs`
- Verify agent is running: `railway status`
- Redeploy if needed: `railway redeploy`

---

### Cause 2: UI Not Recognizing x402 Endpoint

**The UI needs to know:**
1. ✅ Agent has x402 payment support
2. ✅ Endpoint has a `price` field
3. ✅ Endpoint is properly formatted

**Check in manifest:**
```json
{
  "key": "analyze",
  "price": "100000",  // ← This must be present
  "input": {...},
  "output": {...}
}
```

**If price is missing:**
- The UI won't show payment option
- Button won't be clickable

---

### Cause 3: Wallet Not Connected

**The UI needs:**
1. ✅ User has a Web3 wallet (MetaMask, WalletConnect, etc.)
2. ✅ Wallet is connected to Base network
3. ✅ Wallet has USDC balance

**To fix:**
1. Open the UI in a Web3-enabled browser
2. Connect wallet (MetaMask, etc.)
3. Switch to Base network
4. Ensure wallet has USDC

---

### Cause 4: UI Framework Issue

**The UI might not support x402 yet.**

**Check:**
- Is this a custom UI or Daydreams UI?
- Does the UI have x402 payment support?
- Is the UI properly configured?

**If using Daydreams UI:**
- Ensure you're using latest version
- Check Daydreams documentation
- Verify x402 configuration

---

## 🧪 Testing Steps

### Step 1: Verify Agent Manifest
```bash
curl https://web-production-5dad2.up.railway.app/.well-known/agent.json | jq '.entrypoints[0]'
```

**Look for:**
- ✅ `key: "analyze"`
- ✅ `price: "100000"`
- ✅ `input` schema
- ✅ `output` schema

### Step 2: Test Direct API Call

**Without x402 (should fail with 402):**
```bash
curl -X POST https://web-production-5dad2.up.railway.app/ \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {"symbol": "BTC"}
  }'
```

**Expected response:**
```
HTTP 402 Payment Required
X-Payment-Required: {...}
```

### Step 3: Test with x402 Payment

**Generate payment header:**
```bash
# Using x402-axios or similar library
# This requires PRIVATE_KEY to sign payment
```

**Send with payment:**
```bash
curl -X POST https://web-production-5dad2.up.railway.app/ \
  -H "Content-Type: application/json" \
  -H "X-Payment: {payment_header}" \
  -d '{
    "entrypoint": "analyze",
    "input": {"symbol": "BTC"}
  }'
```

**Expected response:**
```
HTTP 200 OK
{
  "output": {...},
  "model": "vibe-trade-v1"
}
```

---

## 🛠️ Solutions

### Solution 1: Verify Agent Manifest Format

**Check the manifest is valid:**
```bash
curl https://web-production-5dad2.up.railway.app/.well-known/agent.json | jq '.'
```

**If error, check logs:**
```bash
railway logs --tail 100
```

---

### Solution 2: Ensure Price Field

**In agent.ts, verify each endpoint has `price`:**

```typescript
addEntrypoint({
  key: "analyze",
  description: "...",
  price: "100000",  // ← REQUIRED for x402
  input: z.object({...}),
  output: z.object({...}),
  async handler(ctx) {...}
});
```

**If missing, add it:**
```typescript
price: "100000", // $0.10 USDC in wei
```

---

### Solution 3: Check UI Configuration

**If using custom UI:**
1. Verify UI has x402 support
2. Check UI is pointing to correct agent URL
3. Verify UI can parse agent manifest
4. Check browser console for errors

**If using Daydreams UI:**
1. Verify you're using latest version
2. Check Daydreams documentation
3. Ensure x402 is enabled in config

---

### Solution 4: Test Wallet Connection

**In browser console:**
```javascript
// Check if wallet is connected
if (window.ethereum) {
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  console.log('Connected accounts:', accounts);
  
  // Check network
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  console.log('Chain ID:', chainId); // Should be 0x2105 for Base
}
```

---

## 📋 Checklist

- [ ] Agent manifest returns valid JSON
- [ ] Manifest includes `price` field
- [ ] Manifest includes `input` and `output` schemas
- [ ] UI is Web3-enabled
- [ ] Wallet is connected
- [ ] Wallet is on Base network
- [ ] Wallet has USDC balance
- [ ] Browser console has no errors
- [ ] Agent is running on Railway

---

## 🔧 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Manifest returns 404 | Agent not running, check `railway logs` |
| Manifest missing `price` | Add `price: "100000"` to endpoint definition |
| UI doesn't show payment | Manifest not recognized, check format |
| Wallet not connecting | UI doesn't have Web3 support |
| Payment fails | Wallet not on Base network or no USDC |
| Button still not clickable | Check browser console for errors |

---

## 📞 Next Steps

1. **Run the checklist above**
2. **Check browser console** for JavaScript errors
3. **Check Railway logs** for agent errors
4. **Verify wallet** is connected to Base
5. **Test direct API call** to confirm agent works
6. **Check UI documentation** if using custom UI

---

## 🎯 What Should Happen

**When INVOKE is clicked:**
1. UI detects x402 payment required
2. UI prompts user to connect wallet
3. User confirms payment in wallet
4. Wallet signs x402 payment
5. Payment sent to agent
6. Agent processes request
7. Response returned to UI
8. UI displays results

---

**If this doesn't happen, check the solutions above!**
