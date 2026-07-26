"use server";

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginUser(formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) return;

  const db = new Database("./data/app.db");

  const user = db
    .prepare(
      `
    SELECT id, email, password_hash
    FROM users
    WHERE email = ?
  `
    )
    .get(email);

  if (!user) return;

  const matches = await bcrypt.compare(password, user.password_hash);

  if (!matches) return;

  const cookieStore = await cookies();

  cookieStore.set("user_id", String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  console.log("setting cookie for user", user.id);
  console.log("cookies after set", cookieStore.getAll());
  redirect("/books?type=library");
}

export async function getInvitationCount(userId){
    if (!userId) return null;

  const db = new Database("./data/app.db");
  return db.prepare(        `
        SELECT COUNT(*) AS count
        FROM invitations
        WHERE to_user_id = ?
          AND status = 'pending'
        `).get(userId)?.count ?? "*"

}

export async function getCurrentUserId() {
  return 4;
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  return userId ? Number(userId) : null;
}
export async function getCurrentUser() {
  //const userId = await getCurrentUserId();
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const db = new Database("./data/app.db");

  return db
    .prepare(
      `
    SELECT
      id,
      username,
      display_name,
      email
    FROM users
    WHERE id = ?
  `
    )
    .get(userId);
}

export async function createUser(formData) {
  const email = formData.get("email")?.toString().trim();
  const displayName = formData.get("displayName")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !displayName || !password) return;

  const username = email.split("@")[0];
  const passwordHash = await bcrypt.hash(password, 10);

  const db = new Database("./data/app.db");

  const result = db
    .prepare(
      `
    INSERT INTO users (
      username,
      email,
      display_name,
      password_hash
    )
    VALUES (?, ?, ?, ?)
  `
    )
    .run(username, email, displayName, passwordHash);

  const cookieStore = await cookies();

  cookieStore.set("user_id", String(result.lastInsertRowid), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/books?type=browse");
}
