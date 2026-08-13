/**
This page returns a list of books. Either a list of books read, a list of books to read, or a ist of books in browsing format
 */
import styles from "./page.module.css";
import Database from "better-sqlite3";
import FrontBook from "@/app/components/FrontBook";
import RecommendationBox from "@/app/components/RecommendationBox";

import {
  loginUser,
  createUser,
  getCurrentUserId,
} from "@/app/actions.js";
import NewUserModal from "@/app/components/NewUserModal.js";
import Link from "next/link";

export async function getRecentFriendRatings(userId) {
  const db = new Database("./data/app.db");
  const u = await getCurrentUserId();
  console.log(u);

  return db
    .prepare(`
      SELECT
        ratings.id AS rating_id,
        ratings.rating,
        ratings.review,
        ratings.created_at,
        books.id AS id,
        books.title,
        books.author,
        books.cover_url,
        users.id AS user_id,
        users.display_name
      FROM ratings
      JOIN books ON books.id = ratings.book_id
      JOIN users ON users.id = ratings.user_id
WHERE
  (
    ratings.user_id = ?
    OR ratings.user_id IN (
      SELECT subscription_id
      FROM friends
      WHERE user_id = ?
    )
  )
  AND ratings.readstatus = 1
      ORDER BY ratings.created_at DESC
      LIMIT 20
    `)
    .all(u, u);
}

export async function getRecentRatings() {
  const db = new Database("./data/app.db");
  const u = await getCurrentUserId();
  console.log(u);

  return db
    .prepare(`
      SELECT
        ratings.id AS rating_id,
        ratings.rating,
        ratings.review,
        ratings.created_at,
        books.id AS id,
        books.title,
        books.author,
        books.cover_url,
        users.id AS user_id,
        users.display_name
      FROM ratings
      JOIN books ON books.id = ratings.book_id
      JOIN users ON users.id = ratings.user_id
      WHERE ratings.readstatus = 1
      ORDER BY ratings.created_at DESC
      LIMIT 20
    `)
    .all();
}


export default async function Home() {
  const userId = await getCurrentUserId();
  let ratings = await getRecentFriendRatings();
  if (userId == null) ratings = await getRecentRatings()

  return (
    <main className={styles.page}>
    
      <section className={styles.content}>
        <h2>Recent Reading Activity</h2>
          {ratings.map((book) => (
            <FrontBook key={book.rating_id} book={book} />
          ))}
      </section>
      {userId ? (
<aside className={styles.sidebar}>
  <h2>Welcome back!</h2>
  <Link href="/books?type=library">Go to your library</Link>
  <RecommendationBox userId={userId} />
</aside>
      ) : (
        <aside className={styles.sidebar}>
          <h2>Sign In</h2>

          <form action={loginUser} className={styles.loginForm}>
            <label>
              Email
              <input type="email" name="email" />
            </label>

            <label>
              Password
              <input type="password" name="password" />
            </label>

            <button type="submit" className="primaryButton">
              SIGN IN
            </button>
          </form>
          <div className={styles.divider}></div>

          <h3>New User</h3>

          <NewUserModal createUser={createUser} />
        </aside>
      )}
    </main>
  );
}
