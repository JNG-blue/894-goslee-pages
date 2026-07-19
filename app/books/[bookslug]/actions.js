// app/books/[bookslug]/actions.js

"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  getCurrentUserId,
  getCurrentUserName,
} from "@/app/actions.js";

export async function addUserTag(formData) {
  const userId = await getCurrentUserId();
  const bookId = Number(formData.get("bookId"));
  const tagName = formData.get("tagName");
  console.log(bookId, tagName);
  if (!tagName) return;

  const db = new Database("./data/app.db");

  let tagRow = db
    .prepare(
      `
  SELECT id
  FROM tags
  WHERE name = ?
`
    )
    .get(tagName);

  if (!tagRow) {
    const result = db
      .prepare(
        `
        INSERT INTO tags (name)
        VALUES (?)
      `
      )
      .run(tagName);

    tagRow = {
      id: result.lastInsertRowid,
    };
  }

  const tagId = tagRow.id;

  db.prepare(
    `
    INSERT OR IGNORE INTO book_tags (
      book_id,
      tag_id,
      user_id
    )
    VALUES (?, ?, ?)
  `
  ).run(bookId, tagId, userId);

  console.log(bookId, tagId, 1, tagName);

  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function addToRead(formData) {
  const bookId = Number(formData.get("bookId"));
  const userId = await getCurrentUserId();

  const db = new Database("./data/app.db");

  db.prepare(
    `
    INSERT OR REPLACE INTO ratings (
      user_id,
      book_id,
      rating,
      readstatus
    )
    VALUES (?, ?, ?, ?)
  `
  ).run(
    userId,
    bookId,
    null,
    2 // Want to Read
  );

  redirect("/books?type=toread");
}

export async function markRead(formData) {
  const bookId = Number(formData.get("bookId"));
  const rating = Number(formData.get("rating"));
  const review = formData.get("review")?.toString().trim() || null;
  const userId = await getCurrentUserId();

  const db = new Database("./data/app.db");

  db.prepare(
    `
  INSERT INTO ratings (
    user_id,
    book_id,
    rating,
    review,
    readstatus
  )
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(user_id, book_id)
  DO UPDATE SET
    rating = excluded.rating,
    review = excluded.review,
    readstatus = excluded.readstatus,
    created_at = CURRENT_TIMESTAMP
`
  ).run(userId, bookId, rating, review, 1);
  redirect("/books?type=library");
}
