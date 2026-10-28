import type { User } from "@/features/auth/types";
import { DURATIONS, MAGIC_EMAILS } from "@/mocks/config";
import { getDb, saveDb, type EmailTokenPurpose, type MockSession, type MockUser } from "@/mocks/db";
import { createPasswordRecord, newId, randomToken, verifyPassword } from "@/mocks/security";

export function toPublicUser(user: MockUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
  };
}

export async function findUserByEmail(email: string): Promise<MockUser | undefined> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  return db.users.find((user) => user.email === normalized);
}

export async function findUserById(id: string): Promise<MockUser | undefined> {
  const db = await getDb();
  return db.users.find((user) => user.id === id);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<MockUser> {
  const db = await getDb();
  const user: MockUser = {
    id: newId(),
    name: input.name,
    email: input.email.trim().toLowerCase(),
    ...(await createPasswordRecord(input.password)),
    isEmailVerified: false,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDb();
  return user;
}

export async function findUserByCredentials(
  email: string,
  password: string,
): Promise<MockUser | undefined> {
  const user = await findUserByEmail(email);
  if (!user) return undefined;
  return (await verifyPassword(password, user)) ? user : undefined;
}

export async function markEmailVerified(user: MockUser): Promise<void> {
  user.isEmailVerified = true;
  saveDb();
}

export async function changePassword(user: MockUser, password: string): Promise<void> {
  Object.assign(user, await createPasswordRecord(password));
  await deleteSessionsOfUser(user.id);
  saveDb();
}

export async function createSession(user: MockUser): Promise<MockSession> {
  const db = await getDb();
  const lifetime =
    user.email === MAGIC_EMAILS.shortlived ? DURATIONS.shortlivedSession : DURATIONS.session;
  const session: MockSession = {
    token: `mock.${randomToken()}`,
    userId: user.id,
    expiresAt: Date.now() + lifetime,
  };
  db.sessions.push(session);
  saveDb();
  return session;
}

export async function findUserBySessionToken(token: string): Promise<MockUser | undefined> {
  const db = await getDb();
  const session = db.sessions.find((candidate) => candidate.token === token);
  if (!session) return undefined;

  if (session.expiresAt <= Date.now()) {
    db.sessions = db.sessions.filter((candidate) => candidate !== session);
    saveDb();
    return undefined;
  }
  return findUserById(session.userId);
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  db.sessions = db.sessions.filter((session) => session.token !== token);
  saveDb();
}

async function deleteSessionsOfUser(userId: string): Promise<void> {
  const db = await getDb();
  db.sessions = db.sessions.filter((session) => session.userId !== userId);
  saveDb();
}

export async function issueEmailToken(user: MockUser, purpose: EmailTokenPurpose) {
  const db = await getDb();
  const now = Date.now();

  for (const old of db.emailTokens) {
    if (old.userId === user.id && old.purpose === purpose && old.usedAt === null) {
      old.usedAt = now;
    }
  }

  const lifetime =
    purpose === "verify-email" ? DURATIONS.verifyEmailToken : DURATIONS.resetPasswordToken;
  const token = randomToken();
  db.emailTokens.push({ token, userId: user.id, purpose, expiresAt: now + lifetime, usedAt: null });
  saveDb();
  return token;
}

export type EmailTokenCheck =
  | { status: "valid"; user: MockUser }
  | { status: "used"; user: MockUser }
  | { status: "expired" }
  | { status: "unknown" };

export async function consumeEmailToken(
  token: string,
  purpose: EmailTokenPurpose,
): Promise<EmailTokenCheck> {
  const db = await getDb();
  const record = db.emailTokens.find(
    (candidate) => candidate.token === token && candidate.purpose === purpose,
  );
  const user = record ? await findUserById(record.userId) : undefined;

  if (!record || !user) return { status: "unknown" };
  if (record.usedAt !== null) return { status: "used", user };
  if (record.expiresAt <= Date.now()) return { status: "expired" };

  record.usedAt = Date.now();
  saveDb();
  return { status: "valid", user };
}
