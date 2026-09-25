export interface StartSubscriptionInput {
  organizationId: string;
  organizationName: string;
  planSlug: string;
  billingCycle: "monthly" | "yearly";
  priceCents: number;
  successUrl: string;
  cancelUrl: string;
}

export interface StartSubscriptionResult {
  /** "active" means the subscription can be marked active immediately (dev mode, or $0 plans). */
  status: "active" | "requires_checkout";
  checkoutUrl?: string;
  externalCustomerId?: string;
  externalSubscriptionId?: string;
}

export interface CancelSubscriptionInput {
  externalSubscriptionId?: string;
}

export interface PaymentProvider {
  readonly name: string;
  startSubscription(input: StartSubscriptionInput): Promise<StartSubscriptionResult>;
  cancelSubscription(input: CancelSubscriptionInput): Promise<void>;
}
