#!/bin/bash

# Direct test of agent endpoint without x402 payment
# This tests if the agent is responding and what it expects

ENDPOINT="https://web-production-5dad2.up.railway.app/entrypoints/analyze/invoke"

echo "🚀 Testing Agent Endpoint (Direct)"
echo "===================================="
echo "Endpoint: $ENDPOINT"
echo ""

# Test: Send request without payment - should get 402
echo "📤 Sending request without payment..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC","timeframe":"1h"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "402" ]; then
  echo "✅ Agent responded with 402 Payment Required"
  echo ""
  echo "Payment Requirements:"
  echo "$BODY" | jq '.accepts[0] | {scheme, network, maxAmountRequired, payTo, asset}' 2>/dev/null || echo "$BODY"
  echo ""
  echo "This confirms:"
  echo "  ✓ Agent is running"
  echo "  ✓ Agent is requesting x402 payment"
  echo "  ✓ Payment infrastructure is working"
  echo "  ✓ Agent endpoint is accessible"
  
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Agent responded with 200 OK"
  echo ""
  echo "Response:"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  
else
  echo "❌ Unexpected response"
  echo "Status: $HTTP_CODE"
  echo "Body: $BODY"
fi
