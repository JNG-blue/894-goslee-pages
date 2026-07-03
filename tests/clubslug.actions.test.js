import { describe, it, expect, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  joinClub,
  leaveClub,
} from "/project/workspace/app/bookclubs/[clubslug]/actions.js";

const db = new Database("./data/app.db");

const TEST_ADMIN_ID = 3;
const TEST_USER_ID = 4;
const TEST_CLUB_NAME = "__TEST_MEMBERSHIP_CLUB__";

function makeTestClub(isPublic) {
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
    .run(TEST_CLUB_NAME, "Temporary Vitest club", TEST_ADMIN_ID, isPublic);

  const clubId = Number(result.lastInsertRowid);

  db.prepare(
    `
    INSERT INTO bookclub_members (
      bookclub_id,
      user_id,
      role
    )
    VALUES (?, ?, ?)
    `
  ).run(clubId, TEST_ADMIN_ID, "admin");

  return clubId;
}

afterEach(() => {
  db.prepare(
    `
    DELETE FROM invitations
    WHERE bookclub_id IN (
      SELECT id FROM bookclubs WHERE name = ?
    )
    `
  ).run(TEST_CLUB_NAME);

  db.prepare(
    `
    DELETE FROM bookclub_members
    WHERE bookclub_id IN (
      SELECT id FROM bookclubs WHERE name = ?
    )
    `
  ).run(TEST_CLUB_NAME);

  db.prepare(
    `
    DELETE FROM bookclubs
    WHERE name = ?
    `
  ).run(TEST_CLUB_NAME);
});

describe("book club membership actions against real db", () => {
  it("joins a public club", async () => {
    const clubId = makeTestClub(1);

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("user_id", String(TEST_USER_ID));
    formData.set("isPublic", "1");

    await expect(joinClub(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT bookclub_id, user_id, role
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(row).toEqual({
      bookclub_id: clubId,
      user_id: TEST_USER_ID,
      role: "member",
    });
  });

  it("does not create duplicate public memberships", async () => {
    const clubId = makeTestClub(1);

    const first = new FormData();
    first.set("clubId", String(clubId));
    first.set("user_id", String(TEST_USER_ID));
    first.set("isPublic", "1");

    await expect(joinClub(first)).rejects.toThrow();

    const second = new FormData();
    second.set("clubId", String(clubId));
    second.set("user_id", String(TEST_USER_ID));
    second.set("isPublic", "1");

    await expect(joinClub(second)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT COUNT(*) AS count
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(row.count).toBe(1);
  });

  it("creates an invitation request for a private club", async () => {
    const clubId = makeTestClub(0);

    const formData = new FormData();
    formData.set("clubId", String(clubId));
    formData.set("user_id", String(TEST_USER_ID));
    formData.set("isPublic", "0");

    await expect(joinClub(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT
          type,
          status,
          from_user_id,
          to_user_id,
          bookclub_id
        FROM invitations
        WHERE bookclub_id = ?
          AND from_user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(row).toEqual({
      type: "bookclub_request",
      status: "pending",
      from_user_id: TEST_USER_ID,
      to_user_id: TEST_ADMIN_ID,
      bookclub_id: clubId,
    });
  });

  it("allows a regular member to leave", async () => {
    const clubId = makeTestClub(1);

    db.prepare(
      `
      INSERT INTO bookclub_members (
        bookclub_id,
        user_id,
        role
      )
      VALUES (?, ?, ?)
      `
    ).run(clubId, TEST_USER_ID, "member");

    const formData = new FormData();
    formData.set("clubId", String(clubId));

    await expect(leaveClub(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT user_id
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(row).toBeUndefined();
  });

  it("does not remove an admin", async () => {
    const clubId = makeTestClub(1);

    db.prepare(
      `
      INSERT INTO bookclub_members (
        bookclub_id,
        user_id,
        role
      )
      VALUES (?, ?, ?)
      `
    ).run(clubId, TEST_USER_ID, "admin");

    const formData = new FormData();
    formData.set("clubId", String(clubId));

    await expect(leaveClub(formData)).rejects.toThrow();

    const row = db
      .prepare(
        `
        SELECT user_id, role
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(row).toEqual({
      user_id: TEST_USER_ID,
      role: "admin",
    });
  });
});
