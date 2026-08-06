// app/[userslug]/id/page.jsx

import Database from "better-sqlite3";
import { getCurrentUser, getCurrentUserId } from "@/app/actions.js";
import styles from "./page.module.css";
import { toggleFollow } from "@/app/user/[userslug]/actions.js";
import TagBox from "@/app/components/TagBox";
import { UnifrakturMaguntia } from "next/font/google";

const avatarFont = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
});

const db = new Database("./data/app.db");

async function getUserProfile(userslug, viewerUserId) {
  const me = await getCurrentUser();

  const user = db
    .prepare(
      `
        SELECT
          id,
          username,
          display_name
        FROM users
        WHERE id = ?
      `
    )
    .get(userslug);

  if (!user) {
    return null;
  }

  const viewerFollows = viewerUserId
    ? !!db
        .prepare(
          `
            SELECT 1
            FROM friends
            WHERE user_id = ?
              AND subscription_id = ?
          `
        )
        .get(me.id, user.id)
    : false;

  const followsViewer = viewerUserId
    ? !!db
        .prepare(
          `
            SELECT 1
            FROM friends
            WHERE user_id = ?
              AND subscription_id = ?
          `
        )
        .get(user.id, me.id)
    : false;
  const isOwnProfile = user.id == me.id;

  return {
    id: user.id,
    slug: user.username,
    username: user.username,
    displayName: user.display_name || user.username,
    avatarUrl: null,
    isPublic: true,
    followsViewer,
    viewerFollows,
    isOwnProfile,
  };
}

async function getUserReadBooks(userId, page = 1, pageSize = 25) {
  const offset = (page - 1) * pageSize;

  return db
    .prepare(
      `
        SELECT
          books.id,
          books.title,
          books.author,
          books.cover_url AS coverUrl,
          ratings.rating,
          ratings.review
        FROM ratings
        JOIN books ON books.id = ratings.book_id
        WHERE ratings.user_id = ?
          AND ratings.readstatus = 1
        ORDER BY ratings.created_at DESC
        LIMIT ?
        OFFSET ?
      `
    )
    .all(userId, pageSize, offset);
}

  const TopTags = [
    'history', "children's fiction", 'new york times bestseller' , 'mystery',  'biography',
    'fantasy','science fiction', 'nonfiction','magic','psychology',
    'science','philosophy','american literature','romance','literature',
    'english literature','friendship', 'women','classic literature','families',
    ];

function getInitialTagPreferences(userId) {
  if (!userId) return {};

  const db = new Database("./data/app.db");

  const rows = db
    .prepare(`
      SELECT tags.name, user_tag_preferences.preference
      FROM user_tag_preferences
      JOIN tags ON tags.id = user_tag_preferences.tag_id
      WHERE user_tag_preferences.user_id = ?
    `)
    .all(userId);

  const topTagSet = new Set(TopTags);

  return Object.fromEntries(
    rows
      .filter((row) => topTagSet.has(row.name))
      .map((row) => [row.name, row.preference])
  );
}

export default async function UserIdPage({ params }) {
  const me = await getCurrentUser();
  const user = await getUserProfile(params.userslug, me?.id);
  const readBooks = await getUserReadBooks(user.id);
  const initialPreferences = getInitialTagPreferences(me.id);

  return (
    <main className={styles.page}>
      <section className={styles.profile}>
<div className={styles.avatar} aria-label={`${user.displayName} avatar`}>
  <span className={avatarFont.className}>
    {user.displayName?.trim().charAt(0).toUpperCase() || "?"}
  </span>
</div>

        <div className={styles.identity}>
          <h2 className={styles.displayName}>{user.displayName}</h2>
          <p className={styles.username}>{user.username}</p>
        </div>

        <aside className={styles.actions}>
          {!user.isOwnProfile && (
            <form action={toggleFollow.bind(null, me, user)}>
              <input type="hidden" name="profileUserId" value={user.id} />
              <input
                type="hidden"
                name="isFollowing"
                value={user.viewerFollows ? "true" : "false"}
              />

              <button className="primaryButton" type="submit">
                {user.viewerFollows ? "Unfollow" : "Follow"}
              </button>
            </form>
          )}

          <p className={styles.profileNote}>
            {user.isOwnProfile ? (
              "This is your profile"
            ) : (
              <>
                {user.followsViewer
                  ? `\n${user.username} follows you`
                  : `${user.username} does not follow you`}
              </>
            )}
          </p>
        </aside>
      </section>
                  {user.isOwnProfile ? (
             <section>        <TagBox initialPreferences={initialPreferences}/></section>
            ) : (" ")}

      <section className={styles.booksSection}>
        {!user.isOwnProfile && !user.isPublic && !user.viewerFollows ? (
          <p className={styles.privateMessage}>
            Private Account, request follow to see history
          </p>
        ) : (
          <>
            <h3 className={styles.booksHeading}>
              {user.displayName}&apos;s {readBooks.length} Read Books
            </h3>

            <div className={styles.booksList}>
              {readBooks.map((book) => (
                <article key={book.id} className={styles.bookRow}>
                  <div className={styles.bookCover}>
                    {book.coverUrl && (
                      <img
                        src={book.coverUrl}
                        alt=""
                        className={styles.image}
                      />
                    )}
                  </div>

                  <div>
                    <h4 className={styles.bookTitle}>{book.title}</h4>
                    <p className={styles.bookAuthor}>{book.author}</p>
                  </div>

                  <p className={styles.bookRating}>{book.rating || ""}</p>

                  <p className={styles.bookReview}>{book.review || ""}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
