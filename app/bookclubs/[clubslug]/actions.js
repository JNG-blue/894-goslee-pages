"use server";

import Database from "better-sqlite3";
import { redirect } from "next/navigation";
//import { getCurrentUserId } from "@/app/lib/auth";

export async function joinClub(formData) {
  const clubId = Number(formData.get("clubId"));
  //const userId = await getCurrentUserId();

  //if (!userId) return;
  let userId = 4;

  const db = new Database("./data/app.db");

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
