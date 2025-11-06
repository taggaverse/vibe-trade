# Base Wallet Setup for x402 Payments

## 🎯 Overview

Vibe Trade uses a Base network wallet to make x402 payments for services like TAAPI, AIXBT, and other x402-enabled endpoints. This guide explains how to set up and configure your Base wallet.

---

## 🔧 Configuration

### Environment Variables

Add these to your `dreams/.env` file:

```env
# Base Network Configuration (for x402 payments)
BASE_RPC_URL=https://mainnet.base.org
BASE_PRIVATE_KEY=0x...
```

### BASE_RPC_URL

The RPC endpoint used to connect to the Base network.

**Options:**
- **Mainnet:** `https://mainnet.base.org` (production)
- **Testnet:** `https://sepolia.base.org` (testing)
- **Custom:** Any Base-compatible RPC endpoint

**Default:** `https://mainnet.base.org`

### BASE_PRIVATE_KEY

The private key of the wallet that will make x402 payments.

**Requirements:**
- Must be a valid Ethereum private key (0x-prefixed hex string)
- Wallet must have USDC balance on Base to pay for services
- Never commit to version control (use `.env` file only)
- Keep secure and never share

**Format:**
```
BASE_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

---

## 💰 Funding Your Wallet

### Step 1: Get Your Wallet Address

When the agent starts with `BASE_PRIVATE_KEY` set, it will log your wallet address:

```
[vibe-trade] x402 client initialized
[vibe-trade] Wallet address: 0x1234...5678
[vibe-trade] Base RPC: https://mainnet.base.org
[vibe-trade] Ready to make x402 payments for services
```

### Step 2: Bridge USDC to Base

You need USDC on Base to pay for services. Options:

**Option A: Use Coinbase (Easiest)**
1. Go to Coinbase
2. Buy USDC
3. Send to your Base wallet address
4. Select "Base" as the network

**Option B: Bridge from Ethereum**
1. Go to [bridge.base.org](https://bridge.base.org)
2. Connect your wallet
3. Bridge USDC from Ethereum to Base
4. Confirm transaction

**Option C: Use a DEX**
1. Get ETH on Base
2. Swap ETH for USDC on a Base DEX (e.g., Uniswap)

### Step 3: Verify Balance

Check your wallet balance:
```bash
# Using cast (from foundry)
cast balance 0x1234...5678 --rpc-url https://mainnet.base.org

# Or check on Basescan
# https://basescan.org/address/0x1234...5678
```

---

## 🚀 How x402 Payments Work

### Payment Flow

```
1. Agent receives request
   ↓
2. Routes to TAAPI, AIXBT, or other x402 services
   ↓
3. x402 client signs payment with BASE_PRIVATE_KEY
   ↓
4. Payment sent from wallet on Base network
   ↓
5. Service receives payment and responds
   ↓
6. Agent returns data to client
```

### Payment Amounts

**Current pricing:**
- `/analyze` endpoint: $0.10 USDC
- `/perps-funding` endpoint: $0.01 USDC
- `/collection-status` endpoint: Free

**Breakdown for `/analyze`:**
- TAAPI call: ~$0.02
- AIXBT call: ~$0.02
- Hyperliquid call: Free
- Processing: ~$0.04
- **Total:** ~$0.08 (agent keeps ~20%)

---

## 🔒 Security Best Practices

### ✅ DO

- ✅ Use a dedicated wallet for agent payments
- ✅ Keep `BASE_PRIVATE_KEY` in `.env` (not in code)
- ✅ Add `.env` to `.gitignore`
- ✅ Monitor wallet balance regularly
- ✅ Use testnet for development
- ✅ Limit wallet funding to expected usage

### ❌ DON'T

- ❌ Commit `.env` file to version control
- ❌ Share your private key
- ❌ Use a wallet with large balances
- ❌ Store private key in logs or error messages
- ❌ Use mainnet private key for testing
- ❌ Hardcode private key in source code

---

## 🧪 Testing

### Test on Base Sepolia (Testnet)

1. Update `.env`:
```env
BASE_RPC_URL=https://sepolia.base.org
BASE_PRIVATE_KEY=0x...
```

2. Get testnet USDC:
   - Go to [faucet.circle.com](https://faucet.circle.com)
   - Request testnet USDC
   - Select Base Sepolia

3. Start agent:
```bash
cd dreams
bun run dev
```

4. Check logs:
```
[vibe-trade] x402 client initialized
[vibe-trade] Wallet address: 0x...
[vibe-trade] Base RPC: https://sepolia.base.org
[vibe-trade] Ready to make x402 payments for services
```

### Monitor Transactions

View all transactions from your wallet:
- **Mainnet:** https://basescan.org/address/0x...
- **Testnet:** https://sepolia.basescan.org/address/0x...

---

## 🐛 Troubleshooting

### Issue: "BASE_PRIVATE_KEY not set"

**Error:**
```
[vibe-trade] BASE_PRIVATE_KEY not set - x402 payments will fail
```

**Solution:**
1. Check `.env` file exists
2. Verify `BASE_PRIVATE_KEY=0x...` is set
3. Restart agent: `bun run dev`

### Issue: "Failed to initialize x402 client"

**Error:**
```
[vibe-trade] Failed to initialize x402 client: Invalid private key
```

**Solution:**
1. Verify private key format: `0x` + 64 hex characters
2. Check for extra spaces or newlines
3. Ensure it's a valid Ethereum private key

### Issue: "Insufficient funds"

**Error:**
```
[vibe-trade] x402 payment failed: Insufficient balance
```

**Solution:**
1. Check wallet balance: https://basescan.org/address/0x...
2. Bridge more USDC to Base
3. Wait for transaction to confirm

### Issue: "RPC endpoint error"

**Error:**
```
[vibe-trade] Failed to connect to Base RPC
```

**Solution:**
1. Verify `BASE_RPC_URL` is correct
2. Check if RPC endpoint is online
3. Try alternative RPC: `https://base.publicrpc.com`

---

## 📊 Monitoring

### Check Wallet Balance

```bash
# Using cast
cast balance 0x1234...5678 --rpc-url https://mainnet.base.org

# Using curl
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": ["0x1234...5678", "latest"],
    "id": 1
  }'
```

### Monitor Agent Payments

Check logs for payment activity:
```bash
# View recent payments
tail -f dreams/agent.log | grep "x402"

# Count payments
grep "x402 payment" dreams/agent.log | wc -l
```

### Set Up Alerts

Monitor your wallet for low balance:
- Use Basescan alerts
- Set up Discord/Slack notifications
- Use wallet watchers like Tenderly

---

## 💡 Cost Optimization

### Reduce Payment Costs

1. **Batch Requests:** Make multiple analyses in one request
2. **Cache Results:** Don't re-analyze same symbol/timeframe
3. **Use Fallbacks:** Disable expensive sources when not needed
4. **Monitor Usage:** Track which endpoints cost most

### Example: Disable AIXBT

```bash
# In agent routing logic
if (routingDecision.call_aixbt && hasLowBalance) {
  routingDecision.call_aixbt = false;  // Skip expensive call
}
```

---

## 🔄 Wallet Rotation

### Change Wallet

1. Generate new private key
2. Update `BASE_PRIVATE_KEY` in `.env`
3. Fund new wallet with USDC
4. Restart agent
5. Old wallet can be archived

### Migrate Funds

```bash
# Send remaining balance to new wallet
cast send 0xNEW_ADDRESS --value $(cast balance 0xOLD_ADDRESS) \
  --rpc-url https://mainnet.base.org \
  --private-key 0xOLD_PRIVATE_KEY
```

---

## 📚 Resources

- **Base Network:** https://base.org
- **Basescan Explorer:** https://basescan.org
- **Base Testnet Faucet:** https://faucet.circle.com
- **Bridge USDC:** https://bridge.base.org
- **x402 Protocol:** https://x402.org

---

## ✅ Checklist

Before running in production:

- [ ] `BASE_PRIVATE_KEY` is set in `.env`
- [ ] `BASE_RPC_URL` is configured
- [ ] Wallet has USDC balance on Base
- [ ] `.env` is in `.gitignore`
- [ ] Testnet verified (optional but recommended)
- [ ] Wallet address logged and verified
- [ ] Agent starts without errors
- [ ] First payment successful

---

**Status:** ✅ Base Wallet Setup Complete  
**Ready for:** x402 payments on Base network! 🚀
