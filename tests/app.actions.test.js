import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const { cookieValues } = vi.hoisted(() => ({
  cookieValues: new Map(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get(name) {
      const value = cookieValues.get(name);

      return value === undefined ? undefined : { value };
    },

    set(name, value) {
      cookieValues.set(name, String(value));
    },

    getAll() {
      return [...cookieValues].map(([name, value]) => ({
        name,
        value,
      }));
    },
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import {
  loginUser,
  getCurrentUserId,
  getCurrentUser,
  createUser,
} from "../app/actions.js";

const db = new Database("./data/app.db");
const TEST_PREFIX = "__test_auth_";

async function makeTestUser(password = "password123") {
  const unique = `${Date.now()}-${Math.random()}`;
  const email = `${TEST_PREFIX}${unique}@example.com`;
  const username = `${TEST_PREFIX}${unique}`;
  const passwordHash = await bcrypt.hash(password, 4);

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
    .run(username, email, "Test User", passwordHash);

  return {
    id: Number(result.lastInsertRowid),
    username,
    email,
    password,
  };
}

beforeEach(() => {
  cookieValues.clear();
});

afterEach(() => {
  db.prepare(
    `
      DELETE FROM users
      WHERE email LIKE ?
      `
  ).run(`${TEST_PREFIX}%`);
});

describe("authentication actions against real db", () => {
  describe("getCurrentUserId", () => {
    it("returns the user ID stored in the cookie", async () => {
      cookieValues.set("user_id", "42");

      await expect(getCurrentUserId()).resolves.toBe(42);
    });

    it("returns null when there is no user cookie", async () => {
      await expect(getCurrentUserId()).resolves.toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns the current user from the database", async () => {
      const testUser = await makeTestUser();

      cookieValues.set("user_id", String(testUser.id));

      const user = await getCurrentUser();

      expect(user).toEqual({
        id: testUser.id,
        username: testUser.username,
        display_name: "Test User",
        email: testUser.email,
      });
    });

    it("returns null when there is no current user", async () => {
      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it("returns undefined when the cookie user does not exist", async () => {
      cookieValues.set("user_id", "999999999");

      await expect(getCurrentUser()).resolves.toBeUndefined();
    });
  });

  describe("loginUser", () => {
    it("logs in with valid credentials", async () => {
      const testUser = await makeTestUser();

      const formData = new FormData();
      formData.set("email", `  ${testUser.email}  `);
      formData.set("password", testUser.password);

      await expect(loginUser(formData)).rejects.toThrow(
        "NEXT_REDIRECT:/books?type=library"
      );

      expect(cookieValues.get("user_id")).toBe(String(testUser.id));
    });

    it("returns without an email", async () => {
      const formData = new FormData();
      formData.set("password", "password123");

      await expect(loginUser(formData)).resolves.toBeUndefined();
    });

    it("returns without a password", async () => {
      const formData = new FormData();
      formData.set("email", "someone@example.com");

      await expect(loginUser(formData)).resolves.toBeUndefined();
    });

    it("returns when the user does not exist", async () => {
      const formData = new FormData();
      formData.set("email", `${TEST_PREFIX}missing@example.com`);
      formData.set("password", "password123");

      await expect(loginUser(formData)).resolves.toBeUndefined();

      expect(cookieValues.has("user_id")).toBe(false);
    });

    it("returns when the password is incorrect", async () => {
      const testUser = await makeTestUser();

      const formData = new FormData();
      formData.set("email", testUser.email);
      formData.set("password", "wrong-password");

      await expect(loginUser(formData)).resolves.toBeUndefined();

      expect(cookieValues.has("user_id")).toBe(false);
    });
  });

  describe("createUser", () => {
    it("creates a user and sets the cookie", async () => {
      const unique = `${Date.now()}-${Math.random()}`;
      const email = `${TEST_PREFIX}${unique}@example.com`;

      const formData = new FormData();
      formData.set("email", `  ${email}  `);
      formData.set("displayName", "  New Test User  ");
      formData.set("password", "password123");

      await expect(createUser(formData)).rejects.toThrow(
        "NEXT_REDIRECT:/books?type=browse"
      );

      const user = db
        .prepare(
          `
            SELECT
              id,
              username,
              email,
              display_name,
              password_hash
            FROM users
            WHERE email = ?
            `
        )
        .get(email);

      expect(user).toMatchObject({
        username: email.split("@")[0],
        email,
        display_name: "New Test User",
      });

      expect(cookieValues.get("user_id")).toBe(String(user.id));

      expect(await bcrypt.compare("password123", user.password_hash)).toBe(
        true
      );
    });

    it.each([
      [
        "email",
        {
          displayName: "Test User",
          password: "password123",
        },
      ],
      [
        "display name",
        {
          email: `${TEST_PREFIX}no-name@example.com`,
          password: "password123",
        },
      ],
      [
        "password",
        {
          email: `${TEST_PREFIX}no-password@example.com`,
          displayName: "Test User",
        },
      ],
    ])(
      "returns without creating a user when %s is missing",
      async (_missingField, values) => {
        const formData = new FormData();

        for (const [name, value] of Object.entries(values)) {
          formData.set(name, value);
        }

        await expect(createUser(formData)).resolves.toBeUndefined();
      }
    );
  });
});
