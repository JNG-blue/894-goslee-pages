import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
vi.mock("@/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

import Database from "better-sqlite3";
import {
  addToRead,
  markRead,
  addUserTag,
} from "../app/books/[bookslug]/actions.js";

const db = new Database("./data/app.db");
const TEST_USER_ID = 3;
const TEST_BOOK_TITLE = "__TEST_BOOK__";

function makeTestBook() {
  const result = db
    .prepare(
      `
    INSERT INTO books (title, author, isbn)
    VALUES (?, ?, ?)
  `
    )
    .run(TEST_BOOK_TITLE, "Test Author", `test-${Date.now()}`);

  return result.lastInsertRowid;
}

afterEach(() => {
  db.prepare(
    `
    DELETE FROM ratings
    WHERE book_id IN (SELECT id FROM books WHERE title = ?)
  `
  ).run(TEST_BOOK_TITLE);

  db.prepare(
    `
    DELETE FROM book_tags
    WHERE book_id IN (SELECT id FROM books WHERE title = ?)
  `
  ).run(TEST_BOOK_TITLE);

  db.prepare(
    `
    DELETE FROM books
    WHERE title = ?
  `
  ).run(TEST_BOOK_TITLE);

  db.prepare(
    `
    DELETE FROM tags
    WHERE name LIKE '__TEST_%'
  `
  ).run();
});

describe("book actions against real db", () => {
  it("adds a book to to-read", async () => {
    const bookId = makeTestBook();

    const formData = new FormData();
    formData.set("bookId", String(bookId));

    await expect(addToRead(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
      SELECT user_id, book_id, rating, readstatus
      FROM ratings
      WHERE book_id = ?
    `
      )
      .get(bookId);

    expect(row.readstatus).toBe(2);
    expect(row.rating).toBe(null);
  });
  it("marks a book as read with rating and review", async () => {
    const bookId = makeTestBook();

    const formData = new FormData();
    formData.set("bookId", String(bookId));
    formData.set("rating", "9");
    formData.set("review", "Loved it.");

    await expect(markRead(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
      SELECT user_id, book_id, rating, review, readstatus
      FROM ratings
      WHERE book_id = ?
    `
      )
      .get(bookId);

    expect(row).toMatchObject({
      user_id: TEST_USER_ID,
      book_id: bookId,
      rating: 9,
      review: "Loved it.",
      readstatus: 1,
    });
  });

  it("updates an existing read rating instead of crashing", async () => {
    const bookId = makeTestBook();

    const first = new FormData();
    first.set("bookId", String(bookId));
    first.set("rating", "6");
    first.set("review", "It was okay.");

    await expect(markRead(first)).rejects.toThrow();

    const second = new FormData();
    second.set("bookId", String(bookId));
    second.set("rating", "10");
    second.set("review", "Actually great.");

    await expect(markRead(second)).rejects.toThrow();

    const row = db
      .prepare(
        `
      SELECT rating, review, readstatus
      FROM ratings
      WHERE book_id = ?
    `
      )
      .get(bookId);

    expect(row).toEqual({
      rating: 10,
      review: "Actually great.",
      readstatus: 1,
    });
  });

  it("adds a new user tag to a book", async () => {
    const bookId = makeTestBook();
    const tagName = `__TEST_TAG_${Date.now()}__`;

    const formData = new FormData();
    formData.set("bookId", String(bookId));
    formData.set("tagName", tagName);

    await expect(addUserTag(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
      SELECT
        b.title,
        t.name,
        bt.user_id
      FROM book_tags bt
      JOIN books b ON b.id = bt.book_id
      JOIN tags t ON t.id = bt.tag_id
      WHERE bt.book_id = ?
        AND t.name = ?
        AND bt.user_id = ?
    `
      )
      .get(bookId, tagName, TEST_USER_ID);

    expect(row).toMatchObject({
      title: "__TEST_BOOK__",
      name: tagName,
      user_id: TEST_USER_ID,
    });
  });

  it("does not duplicate an existing user tag", async () => {
    const bookId = makeTestBook();
    const tagName = `__TEST_TAG_${Date.now()}__`;

    const formData = new FormData();
    formData.set("bookId", String(bookId));
    formData.set("tagName", tagName);

    await expect(addUserTag(formData)).rejects.toThrow();

    const formData2 = new FormData();
    formData2.set("bookId", String(bookId));
    formData2.set("tagName", tagName);

    await expect(addUserTag(formData2)).rejects.toThrow();

    const row = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM book_tags bt
      JOIN tags t ON t.id = bt.tag_id
      WHERE bt.book_id = ?
        AND t.name = ?
        AND bt.user_id = ?
    `
      )
      .get(bookId, tagName, TEST_USER_ID);

    expect(row.count).toBe(1);
  });
});
