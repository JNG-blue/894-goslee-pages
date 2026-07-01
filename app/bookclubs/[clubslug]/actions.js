"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";
import { getCurrentUser } from "/project/workspace/app/actions.js";




export async function joinClub(formData) {
  const clubId = Number(formData.get("clubId"));
  const userId = Number(formData.get("user_id"));
  const publicClub = Number(formData.get("isPublic"));

  const db = new Database("./data/app.db");

  if (publicClub === 1) {
    db.prepare(
      `
      INSERT OR IGNORE INTO bookclub_members (
        bookclub_id,
        user_id,
        role
      )
      VALUES (?, ?, ?)
    `
    ).run(clubId, userId, "member");
  } else {
    let admin = db
      .prepare(
        `SELECT user_id
    FROM bookclub_members
    WHERE bookclub_id = ?
      AND role = 'admin'
    LIMIT 1;`
      )
      .get(clubId);
    db.prepare(
      `
      INSERT OR IGNORE INTO invitations (
        type,
        status,
        from_user_id,
        to_user_id,
        bookclub_id
      )
      VALUES (?, ?, ?, ?, ?)
    `
    ).run("bookclub_request", "pending", userId, admin.user_id, clubId);
  }

  redirect(`/bookclubs/${clubId}`);
}
export async function leaveClub(formData) {
  const clubId = Number(formData.get("clubId"));

  //const userId = await getCurrentUserId();

  //if (!userId) return;
  let userId = 4;

  const db = new Database("./data/app.db");

  db.prepare(
    `
    DELETE
    FROM bookclub_members
    WHERE bookclub_id = ?
      AND user_id = ?
      AND role <> 'admin'
  `
  ).run(clubId, userId);

  redirect(`/bookclubs/`);
}
