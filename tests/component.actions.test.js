import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import Database from "better-sqlite3";
import { updateTagPreference } from "@/app/components/actions.js";

vi.mock("@/app/actions.js", () => ({
  getCurrentUserId: vi.fn(async () => 3),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from "next/cache";

const db = new Database("./data/app.db");

const TEST_USER_ID = 3;
const TEST_TAG_NAME = "__TEST_TAG_PREFERENCE__";

function cleanup() {
  const tag = db.prepare("SELECT id FROM tags WHERE name = ?").get(TEST_TAG_NAME);

  if (tag) {
    db.prepare(
      "DELETE FROM user_tag_preferences WHERE user_id = ? AND tag_id = ?"
    ).run(TEST_USER_ID, tag.id);

    db.prepare("DELETE FROM tags WHERE id = ?").run(tag.id);
  }

  vi.clearAllMocks();
}

function makeTestTag() {
  const result = db
    .prepare("INSERT INTO tags (name) VALUES (?)")
    .run(TEST_TAG_NAME);

  return Number(result.lastInsertRowid);
}

beforeEach(cleanup);
afterEach(cleanup);

afterAll(() => {
  db.close();
});

describe("updateTagPreference against real db", () => {
  it("inserts a preference for an existing tag", async () => {
    const tagId = makeTestTag();

    await updateTagPreference(TEST_TAG_NAME, 1);

    const row = db
      .prepare(
        `
        SELECT user_id, tag_id, preference
        FROM user_tag_preferences
        WHERE user_id = ? AND tag_id = ?
        `
      )
      .get(TEST_USER_ID, tagId);

    expect(row).toEqual({
      user_id: TEST_USER_ID,
      tag_id: tagId,
      preference: 1,
    });

    expect(revalidatePath).toHaveBeenCalledWith("/recommendations");
  });

  it("updates an existing preference", async () => {
    const tagId = makeTestTag();

    await updateTagPreference(TEST_TAG_NAME, 1);
    await updateTagPreference(TEST_TAG_NAME, -1);

    const row = db
      .prepare(
        `
        SELECT preference
        FROM user_tag_preferences
        WHERE user_id = ? AND tag_id = ?
        `
      )
      .get(TEST_USER_ID, tagId);

    expect(row.preference).toBe(-1);
  });

  it("deletes the preference when preference is 0", async () => {
    const tagId = makeTestTag();

    await updateTagPreference(TEST_TAG_NAME, 1);
    await updateTagPreference(TEST_TAG_NAME, 0);

    const row = db
      .prepare(
        `
        SELECT *
        FROM user_tag_preferences
        WHERE user_id = ? AND tag_id = ?
        `
      )
      .get(TEST_USER_ID, tagId);

    expect(row).toBeUndefined();
  });

  it("does nothing when the tag does not exist", async () => {
    await updateTagPreference("__MISSING_TEST_TAG__", 1);

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});