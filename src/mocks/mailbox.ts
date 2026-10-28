import { getDb, saveDb, type MockEmail } from "@/mocks/db";
import { newId } from "@/mocks/security";

export async function sendEmail(email: { to: string; subject: string; link: string }) {
  const db = await getDb();
  db.mailbox.push({ id: newId(), sentAt: new Date().toISOString(), ...email });
  saveDb();
}

export async function listMailbox(): Promise<MockEmail[]> {
  const db = await getDb();
  return [...db.mailbox].reverse();
}
