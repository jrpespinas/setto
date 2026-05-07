const SALT = "setto-v1";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(input: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(input);
  return hash === storedHash;
}
