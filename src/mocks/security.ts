function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function newId(): string {
  return crypto.randomUUID();
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

export async function createPasswordRecord(
  password: string,
): Promise<{ passwordSalt: string; passwordHash: string }> {
  const passwordSalt = randomToken(16);
  return { passwordSalt, passwordHash: await hashPassword(password, passwordSalt) };
}

export async function verifyPassword(
  password: string,
  record: { passwordSalt: string; passwordHash: string },
): Promise<boolean> {
  return (await hashPassword(password, record.passwordSalt)) === record.passwordHash;
}
