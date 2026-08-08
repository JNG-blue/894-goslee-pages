import { describe, it, expect, afterEach, afterAll, vi } from "vitest";
import Database from "better-sqlite3";
import { addThreadMessage } from "@/app/bookclubs/[clubslug]/[threadslug]/actions.js";
vi.mock("@/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

const db = new Database("./data/app.db");

const TEST_USER_ID = 3;
const TEST_PREFIX = "__TEST_THREAD_MESSAGE__";
const TEST_CLUB_NAME = "This is a test club";

let testClubId = null;
let testThreadId = null;

function makeTestClub(isPublic) {
  const result = db
    .prepare(
      `
      INSERT INTO bookclubs (
        name,
        description,
        public
      )
      VALUES (?, ?, ?)
      `
    )
    .run(TEST_CLUB_NAME, "Temporary Vitest club", isPublic);

  const clubId = Number(result.lastInsertRowid);
  testClubId = Number(result.lastInsertRowid);

  db.prepare(
    `
    INSERT INTO bookclub_members (
      bookclub_id,
      user_id,
      role
    )
    VALUES (?, ?, ?)
    `
  ).run(testClubId, TEST_USER_ID, "admin");

  return clubId;
}

function makeTestThread(clubId) {
  const result = db
    .prepare(
      `
      INSERT INTO message_threads (
        bookclub_id,
        title,
        created_by_user_id
      )
      VALUES (?, ?, ?)
      `
    )
    .run(clubId, `${TEST_PREFIX}_THREAD`, TEST_USER_ID);

  testThreadId = Number(result.lastInsertRowid);
  return testThreadId;
}

afterEach(() => {
  if (testThreadId) {
    db.prepare(
      `
      DELETE FROM messages
      WHERE thread_id = ?
      `
    ).run(testThreadId);

    db.prepare(
      `
      DELETE FROM message_threads
      WHERE id = ?
      `
    ).run(testThreadId);
  }

  if (testClubId) {
    db.prepare(
      `
      DELETE FROM bookclub_members
      WHERE bookclub_id = ?
      `
    ).run(testClubId);

    db.prepare(
      `
      DELETE FROM bookclubs
      WHERE id = ?
      `
    ).run(testClubId);
  }
  db.prepare("DELETE FROM bookclubs WHERE name = ?").run(TEST_CLUB_NAME);
  testThreadId = null;
  testClubId = null;
});

afterAll(() => {
  db.close();
});

describe("addThreadMessage against real db", () => {
  it("adds a message to an existing thread", async () => {
    const user = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(TEST_USER_ID);

    expect(user).toBeDefined();

    const clubId = makeTestClub();
    const threadId = makeTestThread(clubId);
    const messageBody = `${TEST_PREFIX}_${Date.now()}`;

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("threadId", String(threadId));
    formData.set("body", `  ${messageBody}  `);

    // Next.js redirect() throws a redirect response.
    await expect(addThreadMessage(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT
          thread_id,
          author_user_id,
          body
        FROM messages
        WHERE thread_id = ?
          AND body = ?
        `
      )
      .get(threadId, messageBody);

    expect(row).toEqual({
      thread_id: threadId,
      author_user_id: TEST_USER_ID,
      body: messageBody,
    });
  });

  it("does not add an empty message", async () => {
    const clubId = makeTestClub();
    const threadId = makeTestThread(clubId);

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("threadId", String(threadId));
    formData.set("body", "   ");

    await expect(addThreadMessage(formData)).resolves.toBeUndefined();

    const row = db
      .prepare(
        `
        SELECT id
        FROM messages
        WHERE thread_id = ?
        `
      )
      .get(threadId);

    expect(row).toBeUndefined();
  });
});
