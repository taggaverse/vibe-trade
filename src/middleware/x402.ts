// x402 Payment Middleware
import { Request, Response, NextFunction } from "express";

export function x402PaymentMiddleware(amount: string = "100000") {
  return (req: Request, res: Response, next: NextFunction) => {
    const xPayment = req.headers["x-payment"];
    if (!xPayment) {
      return res.status(402).json({
        error: "Payment Required",
        code: "PAYMENT_REQUIRED",
        timestamp: Date.now(),
      });
    }
    next();
  };
}

export default { x402PaymentMiddleware };
