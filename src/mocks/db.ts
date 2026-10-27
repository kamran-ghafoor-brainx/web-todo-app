import { ignoreErrors } from "@/lib/ignoreErrors";
import { MOCK_DB_STORAGE_KEY } from "@/mocks/config";
import { resetRateLimits } from "@/mocks/rateLimit";
import { createSeedState } from "@/mocks/seed";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  isEmailVerified: boolean;
  createdAt: string;
};

export type MockSession = {
  token: string;
  userId: string;
  expiresAt: number;
};

export type EmailTokenPurpose = "verify-email" | "reset-password";

export type MockEmailToken = {
  token: string;
  userId: string;
  purpose: EmailTokenPurpose;
  expiresAt: number;
  usedAt: number | null;
};

export type MockEmail = {
  id: string;
  to: string;
  subject: string;
  link: string;
  sentAt: string;
};

export type MockDbState = {
  version: 1;
  users: MockUser[];
  sessions: MockSession[];
  emailTokens: MockEmailToken[];
  mailbox: MockEmail[];
};

let state: MockDbState | null = null;
let loading: Promise<MockDbState> | null = null;
let generation = 0;

export async function getDb(): Promise<MockDbState> {
  if (state) return state;
  const loadGeneration = generation;
  loading ??= (async () => {
    const loaded = readSavedState() ?? (await createSeedState());
    if (loadGeneration === generation) {
      state = loaded;
      saveDb();
    }
    return loaded;
  })();
  return loading;
}

export function saveDb(): void {
  if (!state) return;
  const snapshot = JSON.stringify(state);
  ignoreErrors(() => localStorage.setItem(MOCK_DB_STORAGE_KEY, snapshot));
}

export function resetMockDb(): void {
  generation += 1;
  state = null;
  loading = null;
  resetRateLimits();
  ignoreErrors(() => localStorage.removeItem(MOCK_DB_STORAGE_KEY));
}

function readSavedState(): MockDbState | null {
  try {
    const raw = localStorage.getItem(MOCK_DB_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isDbState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isDbState(value: unknown): value is MockDbState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<MockDbState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.sessions) &&
    Array.isArray(candidate.emailTokens) &&
    Array.isArray(candidate.mailbox)
  );
}
