import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sessions, users } from "./db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("remote-cat-session")?.value;
  if (!token) return null;

  const [session] = await db
    .select({ id: sessions.id, userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, token))
    .limit(1);

  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function getUser() {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName, role: users.role })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
}

export async function requireSession() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");
  return user;
}

export async function createSession(userId: number): Promise<string> {
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.id, token));
}
