import { DevPaymentProvider } from "./dev-provider";
import { StripeProvider } from "./stripe-provider";
import type { PaymentProvider } from "./types";

let cachedProvider: PaymentProvider | undefined;

export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.PAYMENT_PROVIDER ?? "dev").toLowerCase();

  if (providerName === "stripe") {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn("[billing] PAYMENT_PROVIDER=stripe but STRIPE_SECRET_KEY is not set; using dev provider instead.");
      cachedProvider = new DevPaymentProvider();
    } else {
      cachedProvider = new StripeProvider({ secretKey });
    }
  } else {
    cachedProvider = new DevPaymentProvider();
  }

  return cachedProvider;
}
