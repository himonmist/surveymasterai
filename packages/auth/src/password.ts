import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      reason: "Password must include uppercase, lowercase, and a number.",
    };
  }
  return { valid: true };
}
