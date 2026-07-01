"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/actions";

export async function createThread(formData) {
  const clubId = Number(formData.get("clubId"));
  const title = formData.get("title")?.toString().trim();
  const location = formData.get("location")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const booklink = formData.get("booklink")?.toString().trim() || null;
  const meetingTime = formData.get("meeting_time")?.toString().trim() || null;

  let bookId = null;

  try {
    const lastPart = booklink.split("/").pop();

    if (/^\d+$/.test(lastPart)) {
      bookId = Number(lastPart);
    }
  } catch {
    bookId = null;
  }

  console.log(bookId); // 231

  const userId = await getCurrentUserId();

  if (!clubId || !title || !userId) return;

  const db = new Database("./data/app.db");

  db.prepare(
    `
    INSERT INTO message_threads (
      bookclub_id,
      title,
      created_by_user_id,
      location,
      pinned, 
      book_id, 
      meeting_time,
      body
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(clubId, title, userId, location, 0, bookId, meetingTime, description);

  redirect(`/bookclubs/${clubId}`);
}
