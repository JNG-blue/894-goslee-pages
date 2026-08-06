import Database from "better-sqlite3";
import Link from "next/link";
import styles from "./ClubPage.module.css";
import { joinClub, leaveClub } from "./actions";
import { getCurrentUser } from "@/app/actions.js";

export default async function OneClub({ params }) {
  const db = new Database("./data/app.db");
  const user = await getCurrentUser();
  const user_id = user?.id ?? user.id ?? 0;
  console.log(user);

  const club = db
    .prepare(
      `
    SELECT
      id,
      name,
      description,
      public
    FROM bookclubs
    WHERE id = ?
  `
    )
    .get(params.clubslug);

  if (!club) {
    return <main className={styles.page}>Club not found</main>;
  }

  const members = db
    .prepare(
      `
    SELECT
      u.id,
      u.username,
      u.display_name,
      bcm.role
    FROM bookclub_members bcm
    JOIN users u ON u.id = bcm.user_id
    WHERE bcm.bookclub_id = ?
    ORDER BY
      CASE WHEN bcm.role = 'admin' THEN 0 ELSE 1 END,
      u.display_name,
      u.username
  `
    )
    .all(club.id);

  const isMember = members.some((member) => member.id === user_id);

  const messages = db
    .prepare(
      `
  SELECT
    mt.id,
    mt.title,
    mt.body,
    mt.location,
    mt.meeting_time,
    mt.pinned,
    mt.created_at,
    mt.book_id,
    b.title AS book_title,
    b.cover_url,
    u.username,
    u.display_name
  FROM message_threads mt
  LEFT JOIN books b ON b.id = mt.book_id
  JOIN users u ON u.id = mt.created_by_user_id
  WHERE mt.bookclub_id = ?
  ORDER BY
    mt.pinned DESC,
    mt.meeting_time IS NULL,
    mt.meeting_time ASC,
    mt.created_at DESC
`
    )
    .all(club.id);
  return (
    <main className={styles.page}>
      <Link href="/bookclubs" className={styles.backLink}>
        ← Back to all clubs
      </Link>

      <section className={styles.header}>
        <div>
          <h1>{club.name}</h1>

          <p className={styles.clubType}>
            {club.public
              ? "This is a public group."
              : "This is a private group."}
            {isMember ? "You are in this group." : "You are not in this group."}
          </p>

          <p className={styles.description}>
            {club.description || "No description yet."}
          </p>
        </div>

        <aside className={styles.membersBox}>
          {!isMember && (
            <form action={joinClub}>
              <input type="hidden" name="clubId" value={club.id} />
              <input type="hidden" name="isPublic" value={club.public} />
              <input type="hidden" name="user_id" value={user_id} />
              <button className="primaryButton">Join Club</button>
            </form>
          )}
          <h2>Members ({members.length})</h2>

          <ul>
            {members.map((member) => (
              <li key={member.id}>
                <span>{member.display_name ?? member.username}</span>

                {member.role === "admin" && (
                  <strong className={styles.adminBadge}>Admin</strong>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className={styles.messages}>
        <h2>Messages and Meetings</h2>
        <Link
          href={`/bookclubs/${club.id}/newthread`}
          className="primaryButton"
        >
          New Message
        </Link>
        <hr />

        {messages.map((message) => (
          <Link
            href={`/bookclubs/${club.id}/${message.id}`}
            className={styles.messageRow}
            key={message.id}
          >
            <div className={styles.messageIcon}>
              {message.cover_url ? (
                <img
                  src={message.cover_url}
                  alt={message.book_title}
                  className={styles.bookCover}
                />
              ) : message.pinned ? (
                "📌"
              ) : message.meeting_time ? (
                "📘"
              ) : (
                ""
              )}
            </div>

            <div className={styles.messageBody}>
              <span className={styles.messageType}>{message.type}</span>
              <h3>{message.title}</h3>
              <p className={styles.date}>{message.date}</p>
              <p>{message.body}</p>
            </div>
          </Link>
        ))}
      </section>
      {isMember && (
        <form action={leaveClub}>
          <input type="hidden" name="clubId" value={club.id} />
          <button className="primaryButton">Leave This Group</button>
        </form>
      )}
    </main>
  );
}
