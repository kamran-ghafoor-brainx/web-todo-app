import { env } from "@/lib/env";

export const MOCK_DB_STORAGE_KEY = "todo-app.mock-db";
export const MOCK_DB_VERSION = 2;

export const MAGIC_PASSWORD = "Passw0rd!";
export const MAGIC_EMAILS = {
  demo: "demo@example.com",
  unverified: "unverified@example.com",
  shortlived: "shortlived@example.com",
  locked: "locked@example.com",
  slow: "slow@example.com",
} as const;

export const MAGIC_FAIL_TITLE = "[fail]";

const SECOND = 1000;
export const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const DURATIONS = {
  session: 2 * HOUR,
  shortlivedSession: 30 * SECOND,
  verifyEmailToken: 24 * HOUR,
  resetPasswordToken: 1 * HOUR,
};

export const RATE_LIMITS = {
  login: { max: 5, windowMs: 1 * MINUTE },
  emailRequest: { max: 1, windowMs: 30 * SECOND },
  lockedRetryAfterSeconds: 60,
};

const IS_TEST = import.meta.env.MODE === "test";
export const LATENCY = {
  minMs: IS_TEST ? 0 : 300,
  maxMs: IS_TEST ? 0 : 800,
  slowMs: IS_TEST ? 0 : 3 * SECOND,
};

export function apiUrl(path: `/${string}`): string {
  return `${env.VITE_API_URL}${path}`;
}
