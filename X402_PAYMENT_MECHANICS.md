# x402 Payment Mechanics - How It Works

## 💰 How YOU Test Payments (Manual)

### Step 1: You Have MetaMask Wallet
```
- MetaMask installed in browser
- Connected to Base network
- Has USDC balance (even $1 is enough for testing)
```

### Step 2: You Click INVOKE Button
```
Browser → Agent: "I want to call /analyze endpoint"
```

### Step 3: Agent Responds with 402
```
Agent → Browser: "402 Payment Required"
Headers: {
  "x-payment-required": {...payment details...}
}
```

### Step 4: x402-fetch Detects 402
```
Browser sees 402 response
x402-fetch library intercepts it
x402-fetch: "Hey, this needs payment!"
```

### Step 5: MetaMask Popup Appears
```
MetaMask shows: "Approve payment of 0.0001 USDC?"
You click: "Confirm"
MetaMask signs the transaction
```

### Step 6: Browser Sends Payment Header
```
Browser → Agent: Same request + payment header
Headers: {
  "x-payment": {
    "chainId": 8453,
    "amount": "100000",  // in wei
    "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  // USDC on Base
    "to": "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429",
    "signature": "0x..."
  }
}
```

### Step 7: Agent Verifies Payment
```
Agent checks: Is signature valid?
Agent checks: Is amount correct?
Agent checks: Is it on Base network?
If all ✓: Process request
```

### Step 8: Agent Processes & Returns Response
```
Agent calls TAAPI, AIXBT, Hyperliquid
Combines results
Returns analysis to you
```

---

## 🤖 How AGENT Pays with x402 (Autonomous)

### The Agent's x402 Client

In `agent.ts` lines 69-90:

```typescript
// Agent has a private key (from environment)
const WALLET_PRIVATE_KEY = process.env.PRIVATE_KEY;

function initializeX402Client() {
  // Create account from private key
  const account = privateKeyToAccount(WALLET_PRIVATE_KEY as `0x${string}`);
  
  // Create axios client with x402 payment interceptor
  x402Client = withPaymentInterceptor(axios.create(), account);
  
  return x402Client;
}
```

### When Agent Calls AIXBT (x402 Service)

**Step 1: Agent Makes Request**
```typescript
const aixbtResult = await x402Client.post(
  "https://api.aixbt.tech/x402/agents/indigo",
  { messages: [...] }
);
```

**Step 2: AIXBT Responds with 402**
```
AIXBT → Agent: "402 Payment Required"
Headers: {
  "x-payment-required": {...}
}
```

**Step 3: x402-axios Interceptor Detects 402**
```
x402-axios sees 402 response
x402-axios: "This needs payment!"
```

**Step 4: Agent Signs Payment with Private Key**
```typescript
// x402-axios automatically:
// 1. Creates payment object
// 2. Signs it with agent's private key
// 3. Generates payment header
const paymentHeader = {
  "chainId": 8453,
  "amount": "50000",  // Agent's budget for AIXBT
  "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "to": "0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429",
  "signature": "0x..."  // Signed with agent's private key
}
```

**Step 5: Agent Resends Request with Payment**
```
Agent → AIXBT: Same request + payment header
```

**Step 6: AIXBT Verifies & Responds**
```
AIXBT verifies signature
AIXBT checks amount
AIXBT processes request
AIXBT → Agent: Response with data
```

**Step 7: Agent Receives Data**
```typescript
const sentimentData = aixbtResult.data;
// Now agent has the sentiment data
```

---

## 🔄 The Payment Flow Diagram

### Manual Payment (You Testing)
```
YOU (Browser)
    ↓
Click INVOKE
    ↓
Browser sends request
    ↓
Agent: 402 Payment Required
    ↓
x402-fetch detects 402
    ↓
MetaMask popup (YOU confirm)
    ↓
Browser signs with MetaMask
    ↓
Browser resends with payment header
    ↓
Agent verifies payment
    ↓
Agent processes request
    ↓
Agent returns response
    ↓
YOU see results
```

### Autonomous Payment (Agent → AIXBT)
```
AGENT (Backend)
    ↓
Decides to call AIXBT
    ↓
Agent sends request
    ↓
AIXBT: 402 Payment Required
    ↓
x402-axios detects 402
    ↓
Agent signs with private key (AUTOMATIC)
    ↓
Agent resends with payment header
    ↓
AIXBT verifies payment
    ↓
AIXBT processes request
    ↓
AIXBT returns sentiment data
    ↓
Agent combines results
    ↓
Agent returns to user
```

---

## 📍 Why We Have 2 Agents

### Agent 1: Root Directory (`/src/agent.ts`)
```
Location: /Users/alectaggart/CascadeProjects/windsurf-project-2/src/
Purpose: Main trading agent deployed to Railway
Features:
  - Receives x402 payments from clients
  - Routes to TAAPI, AIXBT, Hyperliquid
  - Returns trading analysis
  - THIS IS THE PRODUCTION AGENT
```

### Agent 2: Dreams Subdirectory (`/dreams/src/agent.ts`)
```
Location: /Users/alectaggart/CascadeProjects/windsurf-project-2/dreams/
Purpose: OLD/DEPRECATED - kept for reference only
Status: Not deployed, not used
Reason: We restructured to root for Railway compatibility
```

### Why We Restructured

**Old structure (didn't work with Railway):**
```
/dreams/
  /src/
    agent.ts
    index.ts
  package.json
```

**Problem:** Railway's Nixpacks needs `package.json` at root level

**New structure (works with Railway):**
```
/src/
  agent.ts
  index.ts
package.json  ← At root level
```

**Result:** Railway can now auto-detect and build the Bun project

---

## 🧪 Testing Manual Payment (You)

### What You Need
```
✅ MetaMask installed
✅ Connected to Base network
✅ Have some USDC (even $0.01 is enough)
```

### How to Test
```
1. Go to: https://web-production-5dad2.up.railway.app/
2. Open browser console (F12)
3. Click INVOKE button
4. MetaMask popup appears
5. You click "Confirm"
6. Agent processes
7. You see results
```

### What Happens Behind Scenes
```
1. You click INVOKE
2. Browser sends request (no payment yet)
3. Agent responds: 402 Payment Required
4. x402-fetch detects 402
5. MetaMask prompts you
6. You confirm (signs with your private key)
7. Browser resends with payment header
8. Agent verifies your signature
9. Agent processes request
10. Agent returns response
```

---

## 🤖 Testing Autonomous Payment (Agent → AIXBT)

### What Happens Automatically
```
1. Agent receives your payment ✓
2. Agent decides to call AIXBT
3. Agent sends request to AIXBT
4. AIXBT responds: 402 Payment Required
5. x402-axios detects 402
6. Agent signs with its private key (AUTOMATIC)
7. Agent resends with payment header
8. AIXBT verifies agent's signature
9. AIXBT returns sentiment data
10. Agent combines all data
11. Agent returns to you
```

### You Don't Do Anything
```
- Agent handles all payments automatically
- Uses its own private key (from PRIVATE_KEY env var)
- No manual confirmation needed
- All happens in milliseconds
```

---

## 💡 Key Differences

| Aspect | Manual (You) | Autonomous (Agent) |
|--------|-------------|-------------------|
| **Wallet** | MetaMask (browser) | Private key (backend) |
| **Signature** | You confirm in popup | Automatic |
| **Who pays** | You (from your wallet) | Agent (from its wallet) |
| **When** | When you click INVOKE | When agent decides to call service |
| **Confirmation** | Manual (you click) | Automatic (code does it) |
| **Cost** | You pay for agent call | Agent pays for AIXBT call |

---

## 📊 Payment Flow Summary

### Your Payment to Agent
```
You (MetaMask) → Agent (x402 endpoint)
Amount: 0.0001 USDC ($0.10)
Purpose: Pay for analysis
```

### Agent's Payment to AIXBT
```
Agent (private key) → AIXBT (x402 endpoint)
Amount: ~0.00005 USDC ($0.05)
Purpose: Pay for sentiment data
Agent keeps: ~0.00005 USDC ($0.05) as profit
```

---

## ✅ Summary

**Manual Payment (Testing):**
- You click button → MetaMask popup → You confirm → Payment sent → Agent processes

**Autonomous Payment (Production):**
- Agent automatically signs with private key → Sends payment → Gets data → Returns to you

**Two Agents:**
- Root agent: Production (deployed)
- Dreams agent: Old/deprecated (reference only)

---

**Ready to test?**
