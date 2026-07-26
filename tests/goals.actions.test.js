import { describe, it, expect, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import { updateGoal } from "@/app/goals/actions.js";

vi.mock("@/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const db = new Database("./data/app.db");

const TEST_USER_ID = 3;
const TEST_YEAR = 2099;

afterEach(() => {
  db.prepare(
    `
    DELETE FROM goals
    WHERE user_id = ?
      AND year = ?
    `
  ).run(TEST_USER_ID, TEST_YEAR);
});

describe("updateGoal against real db", () => {
  it("creates a reading goal for the current user", async () => {
    const formData = new FormData();
    formData.set("year", String(TEST_YEAR));
    formData.set("targetBooks", "42");

    await updateGoal(formData);

    const row = db
      .prepare(
        `
        SELECT user_id, year, target_books
        FROM goals
        WHERE user_id = ?
          AND year = ?
        `
      )
      .get(TEST_USER_ID, TEST_YEAR);

    expect(row).toEqual({
      user_id: TEST_USER_ID,
      year: TEST_YEAR,
      target_books: 42,
    });
  });

  it("updates an existing reading goal for the current user", async () => {
    db.prepare(
      `
      INSERT INTO goals (user_id, year, target_books)
      VALUES (?, ?, ?)
      `
    ).run(TEST_USER_ID, TEST_YEAR, 12);

    const formData = new FormData();
    formData.set("year", String(TEST_YEAR));
    formData.set("targetBooks", "30");

    await updateGoal(formData);

    const row = db
      .prepare(
        `
        SELECT user_id, year, target_books
        FROM goals
        WHERE user_id = ?
          AND year = ?
        `
      )
      .get(TEST_USER_ID, TEST_YEAR);

    expect(row).toEqual({
      user_id: TEST_USER_ID,
      year: TEST_YEAR,
      target_books: 30,
    });
  });
});