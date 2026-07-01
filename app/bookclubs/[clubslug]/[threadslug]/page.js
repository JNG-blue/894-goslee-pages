import Database from "better-sqlite3";
import Link from "next/link";
import styles from "./ThreadPage.module.css";
import { addThreadMessage } from "./actions";

export default async function ThreadPage({ params }) {
  const { clubslug, threadslug } = await params;

  const db = new Database("./data/app.db");

  const thread = db
    .prepare(
      `
    SELECT
      mt.id,
      mt.bookclub_id,
      mt.title,
      mt.body,
      mt.location,
      mt.meeting_time,
      mt.created_at,
      mt.pinned,
      b.title AS book_title,
      b.author AS book_author,
      b.cover_url,
      u.username,
      u.display_name
    FROM message_threads mt
    LEFT JOIN books b ON b.id = mt.book_id
    JOIN users u ON u.id = mt.created_by_user_id
    WHERE mt.id = ?
      AND mt.bookclub_id = ?
  `
    )
    .get(threadslug, clubslug);

  if (!thread) {
    return <main className={styles.page}>Thread not found</main>;
  }

  const messages = db
    .prepare(
      `
    SELECT
      m.id,
      m.body,
      m.created_at,
      u.username,
      u.display_name
    FROM messages m
    JOIN users u ON u.id = m.author_user_id
    WHERE m.thread_id = ?
    ORDER BY m.created_at ASC
  `
    )
    .all(thread.id);

  return (
    <main className={styles.page}>
      <Link href={`/bookclubs/${clubslug}`} className={styles.backLink}>
        ← Back to club
      </Link>

      <section className={styles.threadHeader}>
        {thread.cover_url && (
          <img
            src={thread.cover_url}
            alt={thread.book_title}
            className={styles.cover}
          />
        )}

        <div>
          <h1>{thread.title}</h1>

          {thread.book_title && (
            <p className={styles.book}>
              {thread.book_title}
              {thread.book_author ? ` by ${thread.book_author}` : ""}
            </p>
          )}

          {thread.meeting_time && <p>{thread.meeting_time}</p>}
          {thread.location && <p>{thread.location}</p>}

          <p className={styles.meta}>
            Posted by {thread.display_name ?? thread.username}
          </p>

          {thread.body && <p className={styles.body}>{thread.body}</p>}
        </div>
      </section>
      <section>
        <form action={addThreadMessage} className={styles.replyForm}>
          <input type="hidden" name="clubId" value={clubslug} />
          <input type="hidden" name="threadId" value={thread.id} />

          <input
            type="text"
            name="body"
            placeholder="Write a reply..."
            required
          />

          <button type="submit">Reply</button>
        </form>
      </section>

      <section className={styles.messages}>
        <h2>Messages</h2>

        {messages.length === 0 ? (
          <p>No replies yet.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={styles.message}>
              <strong>{message.display_name ?? message.username} </strong>
              <span>{message.created_at}</span>
              <p>{message.body}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
