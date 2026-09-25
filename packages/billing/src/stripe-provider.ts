import type { CancelSubscriptionInput, PaymentProvider, StartSubscriptionInput, StartSubscriptionResult } from "./types";

interface StripeConfig {
  secretKey: string;
}

/**
 * Minimal Stripe Checkout integration using the REST API directly (no SDK
 * dependency). Creates a hosted Checkout Session for paid plans; webhook
 * handling to finalize the subscription happens in the web app's
 * /api/webhooks/stripe route.
 */
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe";

  constructor(private readonly config: StripeConfig) {}

  async startSubscription(input: StartSubscriptionInput): Promise<StartSubscriptionResult> {
    if (input.priceCents === 0) {
      return { status: "active" };
    }

    const body = new URLSearchParams({
      mode: "subscription",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(input.priceCents),
      "line_items[0][price_data][recurring][interval]": input.billingCycle === "yearly" ? "year" : "month",
      "line_items[0][price_data][product_data][name]": `SurveyMasterAI - ${input.planSlug} (${input.billingCycle})`,
      "metadata[organizationId]": input.organizationId,
      "metadata[planSlug]": input.planSlug,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      throw new Error(`Stripe checkout session creation failed: ${res.status} ${await res.text()}`);
    }

    const session = (await res.json()) as { id: string; url: string; customer?: string };
    return {
      status: "requires_checkout",
      checkoutUrl: session.url,
      externalSubscriptionId: session.id,
    };
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<void> {
    if (!input.externalSubscriptionId) return;
    await fetch(`https://api.stripe.com/v1/subscriptions/${input.externalSubscriptionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.config.secretKey}` },
    });
  }
}
