"use server";

import Database from "better-sqlite3";
import { revalidatePath } from "next/cache";

const db = new Database("./data/app.db");

export async function acceptInvitation(formData) {
  const invitationId = Number(formData.get("invitationId"));

  const accept = db.transaction((id) => {
    const invite = db
      .prepare(
        `
        SELECT id, type, bookclub_id, from_user_id, to_user_id
        FROM invitations
        WHERE id = ?
      `
      )
      .get(id);

    if (!invite) {
      throw new Error("Invitation not found");
    }

    db.prepare(
      `
      UPDATE invitations
      SET status = 'accepted',
          responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    ).run(id);

    if (invite.type === "bookclub_request") {
      db.prepare(
        `
        INSERT OR IGNORE INTO bookclub_members (
          bookclub_id,
          user_id
        )
        VALUES (?, ?)
      `
      ).run(invite.bookclub_id, invite.from_user_id);
    }
  });

  accept(invitationId);

  redirect(`/bookclubs/${bookclubId}`);
}

export async function rejectInvitation(formData) {
  const invitationId = Number(formData.get("invitationId"));

  db.prepare(
    `
    UPDATE invitations
    SET status = 'rejected',
        responded_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
  ).run(invitationId);

  revalidatePath("/invitations");
}
