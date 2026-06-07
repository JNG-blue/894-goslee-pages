// app/books/[bookslug]/actions.js

"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";

export async function addUserTag(formData) {
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
  ).run(bookId, tagId, 1);

  console.log(bookId, tagId, 1, tagName);

  revalidatePath(`/books/${bookId}`);
  redirect(`/books/${bookId}`);
}

export async function addToRead(formData) {
  const bookId = Number(formData.get("bookId"));

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
    1, // hardcoded user for now
    bookId,
    null,
    2 // Want to Read
  );

  redirect("/books?type=toread");
}
