import { describe, it, expect, afterEach, vi } from "vitest";
import Database from "better-sqlite3";
import {
  acceptInvitation,
  rejectInvitation,
} from "@/app/invitations/actions.js";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const db = new Database("./data/app.db");

const TEST_ADMIN_ID = 3;
const TEST_USER_ID = 4;
const TEST_CLUB_NAME = "__TEST_INVITATION_CLUB__";

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
    .run(TEST_CLUB_NAME, "Temporary invitation test club", TEST_ADMIN_ID, 0);

  return Number(result.lastInsertRowid);
}

function makeTestInvitation(clubId) {
  const result = db
    .prepare(
      `
      INSERT INTO invitations (
        type,
        status,
        from_user_id,
        to_user_id,
        bookclub_id
      )
      VALUES (?, ?, ?, ?, ?)
      `
    )
    .run("bookclub_request", "pending", TEST_USER_ID, TEST_ADMIN_ID, clubId);

  return Number(result.lastInsertRowid);
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

describe("invitation actions against real db", () => {
  it("accepts a book club request and adds the requester", async () => {
    const clubId = makeTestClub();
    const invitationId = makeTestInvitation(clubId);

    const formData = new FormData();
    formData.set("invitationId", String(invitationId));

    await expect(acceptInvitation(formData)).rejects.toThrow();

    const invitation = db
      .prepare(
        `
        SELECT status, responded_at
        FROM invitations
        WHERE id = ?
        `
      )
      .get(invitationId);

    expect(invitation.status).toBe("accepted");
    expect(invitation.responded_at).not.toBeNull();

    const membership = db
      .prepare(
        `
        SELECT bookclub_id, user_id, role
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(membership).toEqual({
      bookclub_id: clubId,
      user_id: TEST_USER_ID,
      role: "member",
    });
  });

  it("declines an invitation without adding the requester", async () => {
    const clubId = makeTestClub();
    const invitationId = makeTestInvitation(clubId);

    const formData = new FormData();
    formData.set("invitationId", String(invitationId));

    await expect(rejectInvitation(formData)).resolves.toBeUndefined();

    const invitation = db
      .prepare(
        `
        SELECT status, responded_at
        FROM invitations
        WHERE id = ?
        `
      )
      .get(invitationId);

    expect(invitation.status).toBe("declined");
    expect(invitation.responded_at).not.toBeNull();

    const membership = db
      .prepare(
        `
        SELECT user_id
        FROM bookclub_members
        WHERE bookclub_id = ?
          AND user_id = ?
        `
      )
      .get(clubId, TEST_USER_ID);

    expect(membership).toBeUndefined();
  });

  it("throws when accepting a missing invitation", async () => {
    const formData = new FormData();
    formData.set("invitationId", "-1");

    await expect(acceptInvitation(formData)).rejects.toThrow(
      "Invitation not found"
    );
  });
});
