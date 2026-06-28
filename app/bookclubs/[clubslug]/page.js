import Database from "better-sqlite3";
import Link from "next/link";
import styles from "./ClubPage.module.css";
import { joinClub, leaveClub } from "./actions";
import { getCurrentUser } from "/project/workspace/app/actions.js";

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

  const fakeMessages = [
    {
      type: "Upcoming",
      title: "Dragon Fairy Something by Gregg",
      date: "1/1/2027",
      body: "Our next meeting will be to discuss Dragon Fairy Something by Gregg. Chapters 1–10 for now!",
    },
    {
      type: "Past",
      title: "Piranesi by Suzanne Price",
      date: "6/4/2026",
      body: "This event has passed. This chat thread is archived.",
    },
    {
      type: "Discussion",
      title: "2027 Book Club Reading Suggestions",
      date: "2/20/2026",
      body: "Drop your suggestions for what we should read in 2027.",
    },
  ];

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
              <button className={styles.clubButton}>Join Club</button>
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

        {fakeMessages.map((message) => (
          <article key={message.title} className={styles.messageRow}>
            <div className={styles.messageIcon}>
              {message.type === "Upcoming"
                ? "📌"
                : message.type === "Past"
                ? "📘"
                : "💬"}
            </div>

            <div className={styles.messageBody}>
              <span className={styles.messageType}>{message.type}</span>
              <h3>{message.title}</h3>
              <p className={styles.date}>{message.date}</p>
              <p>{message.body}</p>
            </div>
          </article>
        ))}
      </section>
      {isMember && (
        <form action={leaveClub}>
          <input type="hidden" name="clubId" value={club.id} />
          <button className={styles.clubButton}>Leave This Group</button>
        </form>
      )}
    </main>
  );
}
