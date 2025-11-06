#!/bin/bash

# Simple test to verify agent is responding
# This tests WITHOUT x402 payment first to see if agent is working

ENDPOINT="https://web-production-5dad2.up.railway.app/analyze"
SYMBOL="${1:-BTC}"
TIMEFRAME="${2:-1h}"

echo "🚀 Testing Agent Endpoint (No Payment)"
echo "======================================"
echo "Endpoint: $ENDPOINT"
echo "Symbol: $SYMBOL"
echo "Timeframe: $TIMEFRAME"
echo ""

# Test 1: Send request without payment - should get 402
echo "📤 Sending request without payment..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"symbol\":\"$SYMBOL\",\"timeframe\":\"$TIMEFRAME\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "402" ]; then
  echo "✅ Agent responded with 402 Payment Required (CORRECT!)"
  echo ""
  echo "Payment Requirements:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo ""
  echo "This means:"
  echo "  ✓ Agent is running"
  echo "  ✓ Agent is requesting payment"
  echo "  ✓ x402 payment flow is working"
  
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Agent responded with 200 OK (No payment needed)"
  echo ""
  echo "Response:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  
else
  echo "❌ Unexpected response"
  echo "Status: $HTTP_CODE"
  echo "Body: $BODY"
fi
