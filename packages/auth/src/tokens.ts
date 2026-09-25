import { randomBytes } from "node:crypto";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function generateSlug(base: string): string {
  const cleaned = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = randomBytes(3).toString("hex");
  return `${cleaned || "org"}-${suffix}`;
}

export function generateSurveySlug(): string {
  return randomBytes(5).toString("hex");
}
