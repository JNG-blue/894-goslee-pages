"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/actions.js";

export async function addThreadMessage(formData) {
  const clubId = Number(formData.get("clubId"));
  const threadId = Number(formData.get("threadId"));
  const body = formData.get("body")?.toString().trim();
  const userId = await getCurrentUserId();

  if (!clubId || !threadId || !userId || !body) return;

  const db = new Database("./data/app.db");

  db.prepare(
    `
    INSERT INTO messages (
      thread_id,
      author_user_id,
      body
    )
    VALUES (?, ?, ?)
  `
  ).run(threadId, userId, body);

  redirect(`/bookclubs/${clubId}/${threadId}`);
}
