# Daydreams UI - x402 Payment Setup

## 🎯 Issue

The INVOKE button in the Daydreams UI is not clickable and doesn't trigger x402 payment prompts.

## 🔍 Root Cause

The Daydreams UI that comes with `@lucid-dreams/agent-kit` may not have full x402 payment support enabled by default, or it needs specific configuration to recognize and handle x402 endpoints.

---

## ✅ Solutions

### Solution 1: Verify Agent Manifest Format

The UI needs the agent manifest to explicitly indicate x402 support.

**Check your manifest:**
```bash
curl https://web-production-5dad2.up.railway.app/.well-known/agent.json
```

**Ensure it includes:**
```json
{
  "name": "vibe-trade",
  "version": "1.0.0",
  "description": "...",
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

**Key fields for x402:**
- ✅ `price` - Must be present (in wei)
- ✅ `input` - Schema for request
- ✅ `output` - Schema for response

---

### Solution 2: Check UI Configuration

The Daydreams UI might need explicit x402 configuration.

**In your agent setup (agent.ts):**

```typescript
const { app, addEntrypoint } = createAgentApp(
  {
    name: "vibe-trade",
    version: "1.0.0",
    description: "AI-powered trading intelligence with x402 micropayments",
  },
  {
    config: configOverrides,
    // Ensure x402 is enabled
    payments: {
      facilitatorUrl: "https://facilitator.daydreams.systems",
      payTo: "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429",
      network: "base",
      defaultPrice: "0.1",
    },
  }
);
```

---

### Solution 3: Enable x402 in UI

The UI needs to be configured to handle x402 payments.

**Check if UI has x402 support:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for any x402-related errors
4. Look for payment-related warnings

**If UI doesn't support x402:**
- Update `@lucid-dreams/agent-kit` to latest version
- Check Daydreams documentation for x402 UI setup
- May need to use custom UI or different framework

---

### Solution 4: Verify Wallet Connection

The UI needs Web3 wallet support for x402 payments.

**Check wallet setup:**
1. Is MetaMask or WalletConnect available?
2. Is wallet connected to Base network?
3. Does wallet have USDC balance?

**In browser console:**
```javascript
// Check if Web3 is available
console.log(window.ethereum);

// Check connected accounts
const accounts = await window.ethereum.request({ method: 'eth_accounts' });
console.log('Connected:', accounts);

// Check network
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
console.log('Chain ID:', chainId); // Should be 0x2105 for Base
```

---

## 🛠️ Implementation Options

### Option 1: Use Built-in Daydreams UI (Recommended)

**Ensure your agent is properly configured:**

```typescript
const { app, addEntrypoint } = createAgentApp(
  {
    name: "vibe-trade",
    version: "1.0.0",
    description: "AI-powered trading intelligence with x402 micropayments",
  },
  {
    config: {
      payments: {
        facilitatorUrl: process.env.FACILITATOR_URL ?? "https://facilitator.daydreams.systems",
        payTo: process.env.PAY_TO ?? "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429",
        network: process.env.NETWORK ?? "base",
        defaultPrice: process.env.DEFAULT_PRICE ?? "0.1",
      },
    },
  }
);

// Add endpoints with price
addEntrypoint({
  key: "analyze",
  description: "Analyze trading opportunities",
  price: "100000", // $0.10 in wei - REQUIRED for x402
  input: z.object({...}),
  output: z.object({...}),
  async handler(ctx) {...}
});
```

**Then access UI at:**
```
https://web-production-5dad2.up.railway.app/
```

---

### Option 2: Custom x402-Enabled UI

If the built-in UI doesn't support x402, create a custom UI:

**Using x402-fetch:**
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/x402-fetch@latest"></script>
</head>
<body>
  <button id="invoke">Invoke Agent</button>
  
  <script>
    document.getElementById('invoke').addEventListener('click', async () => {
      const { x402Fetch } = window;
      
      const response = await x402Fetch(
        'https://web-production-5dad2.up.railway.app/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entrypoint: 'analyze',
            input: { symbol: 'BTC' }
          })
        }
      );
      
      const data = await response.json();
      console.log('Response:', data);
    });
  </script>
</body>
</html>
```

---

### Option 3: Use Daydreams Router UI

The Daydreams Router has its own UI that supports x402:

```
https://router.daydreams.systems/
```

This UI is specifically designed for x402 payments and should work out of the box.

---

## 🔧 Troubleshooting

### Issue: Button Still Not Clickable

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Agent manifest format
4. Wallet connection status

**Fix:**
```bash
# Verify manifest
curl https://web-production-5dad2.up.railway.app/.well-known/agent.json | jq '.'

# Check agent logs
railway logs --tail 50

# Test direct API call
curl -X POST https://web-production-5dad2.up.railway.app/ \
  -H "Content-Type: application/json" \
  -d '{"entrypoint": "analyze", "input": {"symbol": "BTC"}}'
```

### Issue: Wallet Not Connecting

**Check:**
1. MetaMask is installed
2. MetaMask is unlocked
3. You're on Base network
4. You have USDC balance

**Fix:**
```javascript
// In browser console
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x2105' }], // Base mainnet
});
```

### Issue: Payment Fails

**Check:**
1. Wallet has USDC balance
2. Wallet is on Base network
3. Agent is running
4. PRIVATE_KEY is set in agent

**Fix:**
1. Get USDC on Base (via bridge or exchange)
2. Verify wallet on Basescan
3. Check agent logs for payment errors

---

## 📊 Expected Behavior

**When everything is working:**

1. ✅ INVOKE button is clickable
2. ✅ Click INVOKE
3. ✅ MetaMask popup appears
4. ✅ User confirms payment
5. ✅ Payment sent to agent
6. ✅ Agent processes request
7. ✅ Response displayed in UI

---

## 🚀 Next Steps

1. **Verify manifest** - Check agent returns proper JSON
2. **Check UI version** - Ensure latest `@lucid-dreams/agent-kit`
3. **Test wallet** - Verify MetaMask is connected to Base
4. **Check logs** - Look for errors in browser console and agent logs
5. **Try custom UI** - If built-in UI doesn't work, use x402-fetch example

---

## 📚 Resources

- [Daydreams Documentation](https://docs.dreams.fun/)
- [x402 Protocol](https://www.x402.org/)
- [x402-fetch Library](https://github.com/coinbase/x402)
- [Agent Kit Documentation](https://docs.dreams.fun/docs/core/first-agent)

---

**Status:** ⚠️ Investigating UI x402 Support  
**Next:** Test with custom x402-fetch UI if built-in doesn't work
