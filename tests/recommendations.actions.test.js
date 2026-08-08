import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import Database from "better-sqlite3";
import { ignoreRecommendation } from "@/app/recommendations/actions.js";

vi.mock("@/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";

const db = new Database("./data/app.db");

const TEST_USER_ID = 3;
const TEST_BOOK_TITLE = "__TEST_IGNORE_RECOMMENDATION_BOOK__";

function cleanup() {
  const book = db.prepare("SELECT id FROM books WHERE title = ?").get(TEST_BOOK_TITLE);

  if (book) {
    db.prepare("DELETE FROM ratings WHERE book_id = ?").run(book.id);
    db.prepare("DELETE FROM books WHERE id = ?").run(book.id);
  }

  vi.clearAllMocks();
}

function makeTestBook() {
  const result = db
    .prepare("INSERT INTO books (title) VALUES (?)")
    .run(TEST_BOOK_TITLE);

  return Number(result.lastInsertRowid);
}

beforeEach(cleanup);
afterEach(cleanup);

afterAll(() => {
  db.close();
});

describe("ignoreRecommendation against real db", () => {
  it("sets readstatus to 3 for the current user and book", async () => {
    const bookId = makeTestBook();

    const formData = new FormData();
    formData.set("bookId", String(bookId));

    await ignoreRecommendation(formData);

    const row = db
      .prepare(
        `
        SELECT user_id, book_id, readstatus
        FROM ratings
        WHERE user_id = ? AND book_id = ?
        `
      )
      .get(TEST_USER_ID, bookId);

    expect(row).toEqual({
      user_id: TEST_USER_ID,
      book_id: bookId,
      readstatus: 3,
    });

    expect(revalidatePath).toHaveBeenCalledWith("/recommendations");
  });

  it("does nothing with incomplete data", async () => {
    const before = db.prepare("SELECT COUNT(*) AS count FROM ratings").get().count;

    await ignoreRecommendation(new FormData());

    const after = db.prepare("SELECT COUNT(*) AS count FROM ratings").get().count;

    expect(after).toBe(before);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates an existing rating instead of duplicating it", async () => {
    const bookId = makeTestBook();

    db.prepare(
      `
      INSERT INTO ratings (user_id, book_id, readstatus)
      VALUES (?, ?, 1)
      `
    ).run(TEST_USER_ID, bookId);

    const formData = new FormData();
    formData.set("bookId", String(bookId));

    await ignoreRecommendation(formData);

    const row = db
      .prepare(
        `
        SELECT COUNT(*) AS count, MAX(readstatus) AS readstatus
        FROM ratings
        WHERE user_id = ? AND book_id = ?
        `
      )
      .get(TEST_USER_ID, bookId);

    expect(row).toEqual({
      count: 1,
      readstatus: 3,
    });
  });
});