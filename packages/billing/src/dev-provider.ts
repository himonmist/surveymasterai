import { randomUUID } from "node:crypto";
import type { CancelSubscriptionInput, PaymentProvider, StartSubscriptionInput, StartSubscriptionResult } from "./types";

/**
 * Development/self-hosted fallback payment provider. It activates
 * subscriptions immediately without charging anything, so the full product
 * experience (upgrade, downgrade, plan limits) works out of the box before a
 * real payment provider is configured.
 */
export class DevPaymentProvider implements PaymentProvider {
  readonly name = "dev";

  async startSubscription(input: StartSubscriptionInput): Promise<StartSubscriptionResult> {
    return {
      status: "active",
      externalCustomerId: `dev_cus_${randomUUID()}`,
      externalSubscriptionId: `dev_sub_${randomUUID()}`,
    };
  }

  async cancelSubscription(_input: CancelSubscriptionInput): Promise<void> {
    // No-op: nothing external to cancel in dev mode.
  }
}
