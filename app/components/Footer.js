import styles from "./Footer.module.css";
import Database from "better-sqlite3";
import Link from "next/link";


export default async function Footer({ user }) {
  const year = new Date().getFullYear();
  const db = new Database("./data/app.db");

  if (!user?.id) {
    return null;
  }

  const goal = db
    .prepare(
      `
      SELECT target_books
      FROM goals
      WHERE user_id = ?
        AND year = ?
      `
    )
    .get(user.id, year);

  const booksRead = db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM ratings
      WHERE user_id = ?
        AND readstatus = 1
        AND strftime('%Y', created_at) = ?
      `
    )
    .get(user.id, String(year));

  const targetBooks = goal?.target_books ?? 0;
  const readCount = booksRead?.count ?? 0;

  return (
    <footer className={styles.footer}>
  <Link href="/goals" className="primaryButton">
    {goal ? (
      <>
        <span className={styles.progress}>
          {year} {booksRead?.count ?? 0}/{goal.target_books}
        </span>
        <span className={styles.label}>books read</span>
      </>
    ) : (
      <span className={styles.progress}>Set Goals</span>
    )}
  </Link>
    </footer>
  );
}