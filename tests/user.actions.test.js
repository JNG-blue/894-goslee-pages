import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";
import { toggleFollow } from "@/app/user/[userslug]/actions.js";

const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

const db = new Database("./data/app.db");

const TEST_USER_PREFIX = "__vitest_follow_user__";

function makeTestUser(label) {
  const email = `${TEST_USER_PREFIX}_${label}_${Date.now()}@example.com`;

  const result = db
    .prepare(
      `
      INSERT INTO users (
        username,
        email,
        display_name,
        password_hash
      )
      VALUES (?, ?, ?, ?)
      `
    )
    .run(
      `${TEST_USER_PREFIX}_${label}`,
      email,
      `Vitest ${label}`,
      "not-a-real-password-hash"
    );

  return {
    id: Number(result.lastInsertRowid),
    username: `${TEST_USER_PREFIX}_${label}`,
    email,
  };
}

beforeEach(() => {
  revalidatePathMock.mockClear();
});

afterEach(() => {
  db.prepare(
    `
    DELETE FROM friends
    WHERE user_id IN (
      SELECT id FROM users WHERE email LIKE ?
    )
    OR subscription_id IN (
      SELECT id FROM users WHERE email LIKE ?
    )
    `
  ).run(`${TEST_USER_PREFIX}%`, `${TEST_USER_PREFIX}%`);

  db.prepare(
    `
    DELETE FROM users
    WHERE email LIKE ?
    `
  ).run(`${TEST_USER_PREFIX}%`);
});

describe("toggleFollow against real db", () => {
  it("creates a follow when one does not exist", async () => {
    const me = makeTestUser("me_create");
    const user = makeTestUser("user_create");

    await toggleFollow(me, user);

    const row = db
      .prepare(
        `
        SELECT user_id, subscription_id
        FROM friends
        WHERE user_id = ?
          AND subscription_id = ?
        `
      )
      .get(me.id, user.id);

    expect(row).toEqual({
      user_id: me.id,
      subscription_id: user.id,
    });

    expect(revalidatePathMock).toHaveBeenCalledWith(`/${user.id}/id`);
  });

  it("removes a follow when one already exists", async () => {
    const me = makeTestUser("me_remove");
    const user = makeTestUser("user_remove");

    db.prepare(
      `
      INSERT INTO friends (user_id, subscription_id)
      VALUES (?, ?)
      `
    ).run(me.id, user.id);

    await toggleFollow(me, user);

    const row = db
      .prepare(
        `
        SELECT 1
        FROM friends
        WHERE user_id = ?
          AND subscription_id = ?
        `
      )
      .get(me.id, user.id);

    expect(row).toBeUndefined();
    expect(revalidatePathMock).toHaveBeenCalledWith(`/${user.id}/id`);
  });

  it("does nothing when a user tries to follow themselves", async () => {
    const me = makeTestUser("self");

    await toggleFollow(me, me);

    const row = db
      .prepare(
        `
        SELECT 1
        FROM friends
        WHERE user_id = ?
          AND subscription_id = ?
        `
      )
      .get(me.id, me.id);

    expect(row).toBeUndefined();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});