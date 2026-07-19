import Database from "better-sqlite3";
import FriendRow from "../components/FriendRow";
import { getCurrentUser } from "../actions";
import styles from "@/app/bookclubs/[clubslug]/ClubPage.module.css";

async function getFriends(search = "") {
  const db = new Database("./data/app.db");
  const user = await getCurrentUser();
  const user_id = user?.id ?? 0;
  const searchTerm = search.trim();

  if (searchTerm) {
    return db
      .prepare(
        `
        SELECT
          u.id,
          u.username,
          u.email,
          u.display_name,
          COUNT(r.id) AS books_read,
          CASE WHEN f.subscription_id IS NULL THEN 0 ELSE 1 END AS is_friend
        FROM users u
        LEFT JOIN friends f
          ON f.user_id = ?
         AND f.subscription_id = u.id
        LEFT JOIN ratings r
          ON r.user_id = u.id
         AND r.readstatus = 1
        WHERE u.id != ?
          AND u.username LIKE ?
        GROUP BY u.id, u.username, u.email, u.display_name, f.subscription_id
        ORDER BY u.username;
        `
      )
      .all(user_id, user_id, `%${searchTerm}%`);
  }

  return db
    .prepare(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.display_name,
        COUNT(r.id) AS books_read,
        1 AS is_friend
      FROM friends f
      JOIN users u
        ON u.id = f.subscription_id
      LEFT JOIN ratings r
        ON r.user_id = u.id
       AND r.readstatus = 1
      WHERE f.user_id = ?
      GROUP BY u.id, u.username, u.email, u.display_name
      ORDER BY u.id;
      `
    )
    .all(user_id);
}

export default async function Friends({ searchParams }) {
  const search = searchParams?.search ?? "";
  const friends = await getFriends(search);

  return (
    <main>
      <div className={styles.pageHeader}>
        <h1>{search ? "Find Friends" : "Friends"}</h1>

        <form method="GET">
          <input
            type="search"
            name="search"
            placeholder="Search username"
            defaultValue={search}
          />
        </form>
      </div>

      {friends.map((friend) => (
        <FriendRow key={friend.id} friend={friend} />
      ))}
    </main>
  );
}
