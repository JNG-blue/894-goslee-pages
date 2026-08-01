"use server";

import Database from "better-sqlite3";
import { revalidatePath } from "next/cache";
import {  getCurrentUserId} from "@/app/actions.js";

// keep your existing imports/actions above or below as needed

export async function ignoreRecommendation(formData) {
  const userId = await getCurrentUserId();
  const bookId = Number(formData.get("bookId"));

  if (!userId || !bookId) {
    return;
  }

  const db = new Database("./data/app.db");

  db.prepare(`
    INSERT INTO ratings (user_id, book_id, readstatus)
    VALUES (?, ?, 3)
    ON CONFLICT(user_id, book_id)
    DO UPDATE SET
      readstatus = 3,
      created_at = CURRENT_TIMESTAMP
  `).run(userId, bookId);

  revalidatePath("/recommendations");
}