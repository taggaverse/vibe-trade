#!/usr/bin/env node

/**
 * Test x402 payment to agent endpoint
 * Usage: PRIVATE_KEY=0x... bun test-x402-payment.js [symbol] [timeframe]
 * Or: bun test-x402-payment.js <private-key> [symbol] [timeframe]
 */

import axios from 'axios';
import { withPaymentInterceptor } from 'x402-axios';
import { privateKeyToAccount } from 'viem/accounts';

const ENDPOINT = 'https://web-production-5dad2.up.railway.app/entrypoints/analyze/invoke';
const NETWORK = 'base';
const FACILITATOR_URL = 'https://facilitator.daydreams.systems';

async function testPayment() {
  // Get private key from env or CLI arg
  let privateKey = process.env.PRIVATE_KEY || process.argv[2];
  let symbol = process.argv[3] || 'BTC';
  let timeframe = process.argv[4] || '1h';

  // If first arg looks like a key, shift args
  if (process.argv[2] && process.argv[2].startsWith('0x')) {
    privateKey = process.argv[2];
    symbol = process.argv[3] || 'BTC';
    timeframe = process.argv[4] || '1h';
  }

  if (!privateKey) {
    console.error('❌ No private key provided');
    console.error('');
    console.error('Usage:');
    console.error('  PRIVATE_KEY=0x... node test-x402-payment.js [symbol] [timeframe]');
    console.error('  node test-x402-payment.js 0x... [symbol] [timeframe]');
    console.error('');
    console.error('Example:');
    console.error('  PRIVATE_KEY=0x1234... node test-x402-payment.js BTC 1h');
    process.exit(1);
  }

  console.log('🚀 Testing x402 Payment to Agent');
  console.log('================================');
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`Timeframe: ${timeframe}`);
  console.log(`Network: ${NETWORK}`);
  console.log(`Facilitator: ${FACILITATOR_URL}`);
  console.log('');

  try {
    // Create account from private key
    console.log('🔐 Creating account from private key...');
    const account = privateKeyToAccount(privateKey);

    // Create axios client with x402 payment interceptor
    console.log('🔐 Setting up x402 payment interceptor...');
    const client = axios.create();
    const x402Client = withPaymentInterceptor(client, account);

    console.log('📤 Sending request to agent...');
    console.log(`   URL: ${ENDPOINT}`);
    console.log(`   Body: { symbol: "${symbol}", timeframe: "${timeframe}" }`);
    console.log('');
    
    // Make request with x402 payment
    const response = await x402Client.post(ENDPOINT, {
      symbol,
      timeframe,
    });

    console.log('✅ Payment successful!');
    console.log('');
    console.log('📊 Agent Response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.error('');
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testPayment();
