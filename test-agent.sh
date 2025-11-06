#!/bin/bash

# Vibe Trade Agent Testing Script
# Tests all endpoints on the deployed agent

BASE_URL="https://web-production-5dad2.up.railway.app"

echo "🧪 Vibe Trade Agent Testing"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Agent Manifest
echo -e "${YELLOW}Test 1: Agent Manifest${NC}"
echo "GET /.well-known/agent.json"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/.well-known/agent.json")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "$BODY"
fi
echo ""

# Test 2: Analyze Endpoint
echo -e "${YELLOW}Test 2: Analyze Endpoint${NC}"
echo "POST / with entrypoint: analyze"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "analyze",
    "input": {
      "symbol": "BTC",
      "timeframe": "1h"
    }
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "$BODY"
fi
echo ""

# Test 3: Perps-Funding Endpoint
echo -e "${YELLOW}Test 3: Perps-Funding Endpoint${NC}"
echo "POST / with entrypoint: perps-funding"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "perps-funding",
    "input": {
      "markets": ["BTC", "ETH"],
      "include_technicals": true
    }
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "$BODY"
fi
echo ""

# Test 4: Collection Status Endpoint
echo -e "${YELLOW}Test 4: Collection Status Endpoint${NC}"
echo "POST / with entrypoint: collection-status"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -d '{
    "entrypoint": "collection-status",
    "input": {}
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Status: 200 OK${NC}"
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  echo "$BODY"
fi
echo ""

echo "================================"
echo -e "${GREEN}Testing Complete!${NC}"
