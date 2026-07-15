"use server";

import Database from "better-sqlite3";
import { revalidatePath } from "next/cache";

const db = new Database("./data/app.db");

export async function toggleFollow(me, user) {
  console.info(me);
  console.info(user);

  if (!me?.id || !user?.id || me.id === user.id) {
    return;
  }

  const existingFollow = db
    .prepare(
      `
        SELECT 1
        FROM friends
        WHERE user_id = ?
          AND subscription_id = ?
      `
    )
    .get(me.id, user.id);

  if (existingFollow) {
    db.prepare(
      `
        DELETE FROM friends
        WHERE user_id = ?
          AND subscription_id = ?
      `
    ).run(me.id, user.id);
  } else {
    console.log(`${me.username} follows ${user.username}`);
    db.prepare(
      `
        INSERT OR IGNORE INTO friends (user_id, subscription_id)
        VALUES (?, ?)
      `
    ).run(me.id, user.id);
  }

  revalidatePath(`/${user.id}/id`);
}
