import { describe, it, expect, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import { createClub } from "@/app/bookclubs/newclub/actions.js";
vi.mock("@/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

const db = new Database("./data/app.db");

const TEST_USER_ID = 3;
const TEST_CLUB_PREFIX = "__TEST_CREATE_CLUB__";

afterEach(() => {
  db.prepare(
    `
    DELETE FROM bookclub_members
    WHERE bookclub_id IN (
      SELECT id
      FROM bookclubs
      WHERE name LIKE ?
    )
    `
  ).run(`${TEST_CLUB_PREFIX}%`);

  db.prepare(
    `
    DELETE FROM bookclubs
    WHERE name LIKE ?
    `
  ).run(`${TEST_CLUB_PREFIX}%`);
});

describe("createClub against real db", () => {
  it("creates a public club with the current user as admin", async () => {
    const clubName = `${TEST_CLUB_PREFIX}_${Date.now()}`;

    const formData = new FormData();
    formData.set("name", `  ${clubName}  `);
    formData.set("description", "  A public test club  ");

    try {
  await createClub(formData);
} catch (error) {
  console.log("createClub threw:", error);
}

    const club = db
      .prepare(
        `
        SELECT
          id,
          name,
          description,
          public
        FROM bookclubs
        WHERE name = ?
        `
      )
      .get(clubName);

    expect(club).toMatchObject({
      name: clubName,
      description: "A public test club",
      public: 1
    });

    const membership = db
      .prepare(
        `
        SELECT bookclub_id, user_id, role
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(club.id, TEST_USER_ID);

    expect(membership).toEqual({
      bookclub_id: club.id,
      user_id: TEST_USER_ID,
      role: "admin",
    });
  });

  it("creates a private club", async () => {
    const clubName = `${TEST_CLUB_PREFIX}_PRIVATE_${Date.now()}`;

    const formData = new FormData();
    formData.set("name", clubName);
    formData.set("description", "Private test club");
    formData.set("private", "on");

    await expect(createClub(formData)).rejects.toThrow();

    const club = db
      .prepare(
        `
        SELECT name, public
        FROM bookclubs
        WHERE name = ?
        `
      )
      .get(clubName);

    expect(club).toEqual({
      name: clubName,
      public: 0
    });
  });

  it("does not create a club without a name", async () => {
    const formData = new FormData();
    formData.set("name", "   ");
    formData.set("description", "Should not be created");

    await expect(createClub(formData)).resolves.toBeUndefined();

    const row = db
      .prepare(
        `
        SELECT id
        FROM bookclubs
        WHERE description = ?
        `
      )
      .get("Should not be created");

    expect(row).toBeUndefined();
  });
});
