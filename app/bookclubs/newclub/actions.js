"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "/project/workspace/app/actions.js";

export async function createClub(formData) {
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const isPrivate = formData.get("private") === "on";

  const userId = await getCurrentUserId();

  if (!userId || !name) return;

  const db = new Database("./data/app.db");

  const result = db
    .prepare(
      `
    INSERT INTO bookclubs (
      name,
      description,
      public,
      owner_user_id
    )
    VALUES (?, ?, ?, ?)
  `
    )
    .run(name, description, isPrivate ? 0 : 1, userId);

  const clubId = result.lastInsertRowid;

  db.prepare(
    `
    INSERT INTO bookclub_members (
      bookclub_id,
      user_id,
      role
    )
    VALUES (?, ?, ?)
  `
  ).run(clubId, userId, "admin");

  redirect(`/bookclubs/${clubId}`);
}
