
import Database from "better-sqlite3";
import { revalidatePath } from "next/cache";
const db = new Database("./data/app.db");
import {
  getCurrentUserId
} from "@/app/actions.js";

export async function updateGoal(formData) {
  "use server";

  const userId = await getCurrentUserId();
  const year = Number(formData.get("year"));
  const targetBooks = Number(formData.get("targetBooks"));

  console.log(17, userId,year,targetBooks);

  db.prepare(
    `
    INSERT INTO goals (user_id, year, target_books)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, year)
    DO UPDATE SET target_books = excluded.target_books
    `
  ).run(userId, year, targetBooks);
  revalidatePath("/goals");
}
