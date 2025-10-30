// Hyperliquid Trading Service
export async function placeOrder(symbol: string, side: string, size: number, price: number) {
  return {
    order_id: `HL_${Date.now()}`,
    symbol,
    side,
    size,
    price,
    status: "pending",
  };
}

export default { placeOrder };
