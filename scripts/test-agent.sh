,#!/bin/bash

# Test the Vibe Trade agent locally

echo "🧪 Testing Vibe Trade Agent..."
echo ""

# Get the agent manifest
echo "📋 Getting agent manifest..."
curl -s http://localhost:8787/.well-known/agent.json | jq .

echo ""
echo ""

# Test the analyze endpoint
echo "📊 Testing analyze endpoint..."
curl -s -X POST http://localhost:8787/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC",
    "query": "What is the current trend?",
    "timeframe": "1h"
  }' | jq .

echo ""
echo "✅ Test complete!"
