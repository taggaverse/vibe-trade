// x402 Client Utility
// Vibe Trade uses this to pay other x402 endpoints (AIXBT, TAAPI, Dreams, etc.)
// This is how Vibe Trade monetizes - it receives x402 payments and uses USDC to pay other services

import axios from "axios";

/**
 * x402 Client for calling other x402-enabled endpoints
 * 
 * Flow:
 * 1. Client pays Vibe Trade via x402 (receives USDC)
 * 2. Vibe Trade uses this client to pay other x402 endpoints
 * 3. Vibe Trade aggregates responses and returns to client
 * 
 * This creates a chain of x402 payments across the ecosystem
 */

interface X402PaymentConfig {
  amount: string; // Amount in wei (e.g., "100000" for $0.10 USDC)
  network: string; // "base-sepolia" or "base"
  recipientAddress?: string; // Optional recipient override
}

interface X402Response {
  data: any;
  paymentResponse: {
    transaction_hash: string;
    amount: string;
    currency: string;
    network: string;
    timestamp: number;
    status: "pending" | "confirmed";
  };
}

/**
 * Call an x402-enabled endpoint and handle payment
 * 
 * @param endpoint - URL of x402 endpoint
 * @param payload - Request payload
 * @param paymentConfig - Payment configuration
 * @returns Response with payment proof
 */
export async function callX402Endpoint(
  endpoint: string,
  payload: any,
  paymentConfig: X402PaymentConfig
): Promise<X402Response> {
  try {
    // Step 1: Make initial request (will likely get 402)
    let response = await axios.post(endpoint, payload);

    // If we get 402, handle payment
    if (response.status === 402) {
      const paymentRequired = response.data.payment_required;

      // Step 2: Create payment authorization
      // In production, this would use the wallet's private key to sign
      const paymentHeader = createX402PaymentHeader(paymentRequired);

      // Step 3: Retry with payment
      response = await axios.post(endpoint, payload, {
        headers: {
          "X-Payment": paymentHeader,
        },
      });
    }

    // Step 4: Extract payment response
    const paymentResponse = decodeX402PaymentResponse(
      response.headers["x-payment-response"]
    );

    return {
      data: response.data,
      paymentResponse,
    };
  } catch (error) {
    console.error("Error calling x402 endpoint:", error);
    throw error;
  }
}

/**
 * Create x402 payment header
 * In production, this would sign with the wallet's private key
 */
function createX402PaymentHeader(paymentRequired: any): string {
  // Mock implementation - in production, sign with wallet
  const paymentData = {
    amount: paymentRequired.amount,
    recipient: paymentRequired.recipient,
    nonce: Date.now(),
    timestamp: Date.now(),
  };

  return Buffer.from(JSON.stringify(paymentData)).toString("base64");
}

/**
 * Decode x402 payment response from headers
 */
function decodeX402PaymentResponse(header: string | null): any {
  if (!header) {
    return {
      transaction_hash: "0x",
      amount: "0",
      currency: "USDC",
      network: "base-sepolia",
      timestamp: Date.now(),
      status: "pending",
    };
  }

  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding payment response:", error);
    return {
      transaction_hash: "0x",
      amount: "0",
      currency: "USDC",
      network: "base-sepolia",
      timestamp: Date.now(),
      status: "pending",
    };
  }
}

export default {
  callX402Endpoint,
  createX402PaymentHeader,
  decodeX402PaymentResponse,
};
