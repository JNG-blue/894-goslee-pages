import Link from "next/link";
import Database from "better-sqlite3";
import { getCurrentUserId } from "@/app/actions.js";
import { getRecommendedBookIds } from "@/app/algorithm.js";
import {ignoreRecommendation} from "./actions.js";
import styles from "./RecommendationsPage.module.css";

export default async function RecommendationsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return (
      <main className={styles.page}>
        <h1>Recommendations</h1>
        <p>Please sign in to see your recommendations.</p>
      </main>
    );
  }

  const recommendedIds = (await getRecommendedBookIds(userId)).slice(0, 24);

  if (recommendedIds.length === 0) {
    return (
      <main className={styles.page}>
        <h1>Recommendations</h1>
        <p>No recommendations yet.</p>
      </main>
    );
  }

  const db = new Database("./data/app.db");
  const placeholders = recommendedIds.map(() => "?").join(",");

  const books = db
    .prepare(`
      SELECT id, title, author, cover_url
      FROM books
      WHERE id IN (${placeholders})
    `)
    .all(...recommendedIds);

  const booksById = new Map(books.map((book) => [book.id, book]));

  const orderedBooks = recommendedIds
    .map((id) => booksById.get(id))
    .filter(Boolean);

  return (
    <main className={styles.page}>
      <h1>Recommendations</h1>

      <section className="bookGrid">
        {orderedBooks.map((book) => (
          <article key={book.id} className={styles.book}>
            <div className={styles.coverWrap}>
              <Link href={`/books/${book.id}`} className={styles.coverLink}>
                <img
                  src={book.cover_url}
                  alt={`${book.title} cover`}
                  className={styles.cover}
                />
              </Link>

<form action={ignoreRecommendation} className={styles.noForm}>
  <input type="hidden" name="bookId" value={book.id} />

  <button
    type="submit"
    className={styles.noButton}
    aria-label={`Remove ${book.title} from recommendations`}
  >
    &times;
  </button>
</form>
            </div>

            <Link href={`/books/${book.id}`} className={styles.title}>
              {book.title}
            </Link>

            <p className={styles.author}>{book.author}</p>
          </article>
        ))}
      </section>
    </main>
  );
}