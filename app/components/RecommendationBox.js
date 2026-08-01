import Link from "next/link";
import Database from "better-sqlite3";
import { getRecommendedBookIds } from "@/app/algorithm.js";
import styles from "./RecommendationBox.module.css";

export default async function RecommendedBooksSidebar({ userId }) {
  if (!userId) return null;

const recommendedIds = await getRecommendedBookIds(userId);

const sidebarRecommendedIds = recommendedIds
  .toSorted(() => Math.random() - 0.5)
  .slice(0, 6);

  if (sidebarRecommendedIds.length === 0) return null;

  const db = new Database("./data/app.db");
  const placeholders = sidebarRecommendedIds.map(() => "?").join(",");

  const books = db
    .prepare(`
      SELECT id, title, author, cover_url
      FROM books
      WHERE id IN (${placeholders})
    `)
    .all(...sidebarRecommendedIds);

  const booksById = new Map(books.map((book) => [book.id, book]));
  const orderedBooks = sidebarRecommendedIds
    .map((id) => booksById.get(id))
    .filter(Boolean);

  return (
    <section className={styles.recommendations}>
      <h3>Recommendations for you</h3>

      <div className={styles.grid}>
        {orderedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className={styles.coverLink}
            aria-label={`View ${book.title} by ${book.author}`}
          >
            <img
              src={book.cover_url}
              alt={`${book.title} cover`}
              className={styles.cover}
            />
          </Link>
        ))}
      </div>

      <Link href="/recommendations" className={styles.moreLink}>
        See more...
      </Link>
    </section>
  );
}