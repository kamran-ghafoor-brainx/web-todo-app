import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import type { MockDbState, MockUser } from "@/mocks/db";
import { createPasswordRecord, newId } from "@/mocks/security";

const SEED_ACCOUNTS: { name: string; email: string; isEmailVerified: boolean }[] = [
  { name: "Demo User", email: MAGIC_EMAILS.demo, isEmailVerified: true },
  { name: "Unverified User", email: MAGIC_EMAILS.unverified, isEmailVerified: false },
  { name: "Short Lived", email: MAGIC_EMAILS.shortlived, isEmailVerified: true },
  { name: "Locked User", email: MAGIC_EMAILS.locked, isEmailVerified: true },
  { name: "Slow User", email: MAGIC_EMAILS.slow, isEmailVerified: true },
];

export async function createSeedState(): Promise<MockDbState> {
  const createdAt = new Date().toISOString();
  const users: MockUser[] = await Promise.all(
    SEED_ACCOUNTS.map(async (account) => ({
      id: newId(),
      ...account,
      ...(await createPasswordRecord(MAGIC_PASSWORD)),
      createdAt,
    })),
  );

  return { version: 1, users, sessions: [], emailTokens: [], mailbox: [] };
}
