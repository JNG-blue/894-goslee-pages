
import styles from "./Goals.module.css";
import Database from "better-sqlite3";
import { revalidatePath } from "next/cache";
const db = new Database("./data/app.db");
import {
  getCurrentUserId,
  getCurrentUser
} from "@/app/actions.js";
import {updateGoal} from "./actions";


export default async function GoalsPage() {
  const user = await getCurrentUser();
  const year = new Date().getFullYear();

  if (!user?.id) {
    return <main className={styles.page}>Sign in to view your goals.</main>;
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

  const completedBooks = db
    .prepare(
      `
      SELECT books.id, books.title, books.author, books.cover_url
      FROM ratings
      JOIN books ON books.id = ratings.book_id
      WHERE ratings.user_id = ?
        AND ratings.readstatus = 1
        AND strftime('%Y', ratings.created_at) = ?
      ORDER BY ratings.created_at DESC
      `
    )
    .all(user.id, String(year));

  const targetBooks = goal?.target_books ?? 25;
  const booksRead = completedBooks.length;

  const previousYears = [
    { year: 2025, read: 18, target: 25 },
    { year: 2024, read: 31, target: 30 },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.topGrid}>
        <div className={styles.completedSection}>
          <h1>Completed in {year}</h1>

          <div className={styles.bookGrid}>
            {completedBooks.map((book) => (
              <div key={book.id} className={styles.bookCard}>
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className={styles.coverFallback}>{book.title}</div>
                )}

                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.bookAuthor}>{book.author}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.goalCounter}>
          <div className={styles.counterText}>
            <span>{booksRead}</span>
            <span>/</span>

            <form action={updateGoal}>  
              <input type="hidden" name="year" value={year} />
              <input
                className={styles.goalInput}
                name="targetBooks"
                type="number"
                min="1"
                defaultValue={targetBooks}
              />
              <button className={styles.saveButton} type="submit">
                Save
              </button>
            </form>
          </div>

          <p>books read in {year}</p>
        </aside>
      </section>

      <section className={styles.historySection}>
        <h2>Previous years</h2>

        <div className={styles.historyRows}>
          {previousYears.map((goal) => (
            <div key={goal.year} className={styles.historyRow}>
              <span>{goal.year}</span>
              <span>
                {goal.read}/{goal.target} books
              </span>
              <span>{goal.read >= goal.target ? "Complete" : "Incomplete"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}