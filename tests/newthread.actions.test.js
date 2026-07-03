import { describe, it, expect, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import { createThread } from "/project/workspace/app/bookclubs/[clubslug]/newthread/actions.js";
vi.mock("/project/workspace/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

const db = new Database("./data/app.db");

const TEST_USER_ID = 3;
const TEST_CLUB_NAME = "__TEST_THREAD_CLUB__";
const TEST_THREAD_TITLE = "__TEST_THREAD__";
const TEST_BOOK_TITLE = "__TEST_THREAD_BOOK__";

function makeTestClub() {
  const result = db
    .prepare(
      `
      INSERT INTO bookclubs (
        name,
        description,
        owner_user_id,
        public
      )
      VALUES (?, ?, ?, ?)
      `
    )
    .run(TEST_CLUB_NAME, "Temporary club for thread tests", TEST_USER_ID, 1);

  return Number(result.lastInsertRowid);
}

function makeTestBook() {
  const result = db
    .prepare(
      `
      INSERT INTO books (title, author, isbn)
      VALUES (?, ?, ?)
      `
    )
    .run(TEST_BOOK_TITLE, "Test Author", `thread-test-${Date.now()}`);

  return Number(result.lastInsertRowid);
}

afterEach(() => {
  db.prepare(
    `
    DELETE FROM messages
    WHERE thread_id IN (
      SELECT id
      FROM message_threads
      WHERE title = ?
    )
    `
  ).run(TEST_THREAD_TITLE);

  db.prepare(
    `
    DELETE FROM message_threads
    WHERE title = ?
    `
  ).run(TEST_THREAD_TITLE);

  db.prepare(
    `
    DELETE FROM bookclubs
    WHERE name = ?
    `
  ).run(TEST_CLUB_NAME);

  db.prepare(
    `
    DELETE FROM books
    WHERE title = ?
    `
  ).run(TEST_BOOK_TITLE);
});

describe("createThread against real db", () => {
  it("creates a thread for a book club", async () => {
    const clubId = makeTestClub();

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("title", `  ${TEST_THREAD_TITLE}  `);
    formData.set("location", "Library");
    formData.set("description", "Our first discussion");
    formData.set("meeting_time", "2026-07-10 18:00");

    await expect(createThread(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT
          bookclub_id,
          title,
          created_by_user_id,
          location,
          pinned,
          book_id,
          meeting_time,
          body
        FROM message_threads
        WHERE bookclub_id = ?
          AND title = ?
        `
      )
      .get(clubId, TEST_THREAD_TITLE);

    expect(row).toEqual({
      bookclub_id: clubId,
      title: TEST_THREAD_TITLE,
      created_by_user_id: TEST_USER_ID,
      location: "Library",
      pinned: 0,
      book_id: null,
      meeting_time: "2026-07-10 18:00",
      body: "Our first discussion",
    });
  });

  it("extracts the book ID from a book link", async () => {
    const clubId = makeTestClub();
    const bookId = makeTestBook();

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("title", TEST_THREAD_TITLE);
    formData.set("booklink", `/books/example-book/${bookId}`);

    await expect(createThread(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT book_id
        FROM message_threads
        WHERE bookclub_id = ?
          AND title = ?
        `
      )
      .get(clubId, TEST_THREAD_TITLE);

    expect(row.book_id).toBe(bookId);
  });

  it("stores optional fields as null when omitted", async () => {
    const clubId = makeTestClub();

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("title", TEST_THREAD_TITLE);

    await expect(createThread(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT location, book_id, meeting_time, body
        FROM message_threads
        WHERE bookclub_id = ?
          AND title = ?
        `
      )
      .get(clubId, TEST_THREAD_TITLE);

    expect(row).toEqual({
      location: null,
      book_id: null,
      meeting_time: null,
      body: null,
    });
  });
});
