import { toDateOnly } from "@/features/todos/dates";
import { MAGIC_EMAILS, MAGIC_PASSWORD, MINUTE, MOCK_DB_VERSION } from "@/mocks/config";
import type { MockDbState, MockTodo, MockUser } from "@/mocks/db";
import { createPasswordRecord, newId } from "@/mocks/security";

const SEED_ACCOUNTS: { name: string; email: string; isEmailVerified: boolean }[] = [
  { name: "Demo User", email: MAGIC_EMAILS.demo, isEmailVerified: true },
  { name: "Unverified User", email: MAGIC_EMAILS.unverified, isEmailVerified: false },
  { name: "Short Lived", email: MAGIC_EMAILS.shortlived, isEmailVerified: true },
  { name: "Locked User", email: MAGIC_EMAILS.locked, isEmailVerified: true },
  { name: "Slow User", email: MAGIC_EMAILS.slow, isEmailVerified: true },
];

type SeedTodo = {
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueInDays: number | null;
};

const DEMO_TODOS: SeedTodo[] = [
  {
    title: "Plan the week",
    description: "Pick the three most important tasks and block time for them.",
    isCompleted: false,
    dueInDays: 2,
  },
  {
    title: "Buy groceries",
    description: "Milk, eggs, bread and coffee.",
    isCompleted: false,
    dueInDays: 0,
  },
  {
    title: "Renew library books",
    description: null,
    isCompleted: false,
    dueInDays: -3,
  },
  {
    title: "Call the dentist",
    description: "Book a check-up for next month.",
    isCompleted: true,
    dueInDays: -1,
  },
  {
    title: "Read chapter 4",
    description: null,
    isCompleted: false,
    dueInDays: null,
  },
];

function dateOnlyInDays(days: number, now: Date): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return toDateOnly(date);
}

export function createSeedTodos(users: MockUser[], now = new Date()): MockTodo[] {
  const demo = users.find((user) => user.email === MAGIC_EMAILS.demo);
  if (!demo) return [];

  return DEMO_TODOS.map((todo, index) => {
    const createdAt = new Date(now.getTime() - index * MINUTE).toISOString();
    return {
      id: newId(),
      userId: demo.id,
      title: todo.title,
      description: todo.description,
      isCompleted: todo.isCompleted,
      dueDate: todo.dueInDays === null ? null : dateOnlyInDays(todo.dueInDays, now),
      createdAt,
      updatedAt: createdAt,
    };
  });
}

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

  return {
    version: MOCK_DB_VERSION,
    users,
    sessions: [],
    emailTokens: [],
    mailbox: [],
    todos: createSeedTodos(users),
  };
}
