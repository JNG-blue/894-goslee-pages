"use server";

import Database from "better-sqlite3";
import { revalidatePath } from "next/cache";
import {  getCurrentUserId} from "@/app/actions.js";

export async function updateTagPreference(tagName, preference) {
  const userId = await getCurrentUserId();

  if (!userId || !tagName) {
    return;
  }

  const db = new Database("./data/app.db");

  const tag = db
    .prepare(`
      SELECT id
      FROM tags
      WHERE name = ?
    `)
    .get(tagName);

  if (!tag) {
    return;
  }

  if (preference === 0) {
    db.prepare(`
      DELETE FROM user_tag_preferences
      WHERE user_id = ? AND tag_id = ?
    `).run(userId, tag.id);
  } else {
    db.prepare(`
      INSERT INTO user_tag_preferences (user_id, tag_id, preference)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, tag_id)
      DO UPDATE SET
        preference = excluded.preference,
        created_at = CURRENT_TIMESTAMP
    `).run(userId, tag.id, preference);
  }

  revalidatePath("/recommendations");
}