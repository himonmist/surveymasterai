export const FEATURE_FLAGS = {
  AI_DOCUMENT_UPLOAD: "ai_document_upload",
  AI_CHAT_ASSISTANT: "ai_chat_assistant",
  WHITE_LABEL: "white_label",
  SSO: "sso",
  MARKETPLACE: "marketplace",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
