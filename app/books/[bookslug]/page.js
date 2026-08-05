import Database from "better-sqlite3";
import styles from "./OneBook.module.css";
import AddTagButton from "@/app/components/AddTagButton";
import ReadBookModal from "@/app/components/ReadBookModal.js";
import { addToRead, addUserTag, markRead } from "./actions";
import {
  getCurrentUserId,
  getCurrentUser,
} from "@/app/actions.js";

function recalculateBookAverageRating(bookId) {
    const db = new Database("./data/app.db");
  const result = db
    .prepare(
      `
      SELECT ROUND(AVG(rating), 1) AS average_rating
      FROM ratings
      WHERE book_id = ?
        AND rating IS NOT NULL
      `
    )
    .get(bookId);

  db.prepare(
    `
    UPDATE books
    SET average_rating = ?
    WHERE id = ?
    `
  ).run(result.average_rating, bookId);

  return result.average_rating;
}
export default async function OneBook({ params }) {
  const db = new Database("./data/app.db");
   const { bookslug } = await params;
   const userId = await getCurrentUserId();
   const a = recalculateBookAverageRating(bookslug);

  const book = db
    .prepare(
      `
      SELECT
      b.*,
      GROUP_CONCAT(DISTINCT t.name) AS tags
    FROM books b
    LEFT JOIN book_tags bt ON bt.book_id = b.id
    LEFT JOIN tags t ON t.id = bt.tag_id
    WHERE b.id = ?
    GROUP BY b.id
`
    )
    .get(bookslug);

  if (!book) {
    return <main>Book not found</main>;
  }
  const tags = db
    .prepare(
      `
  SELECT DISTINCT
    t.id,
    t.name,
    CASE
      WHEN user_bt.user_id IS NULL THEN 0
      ELSE 1
    END AS selected
  FROM book_tags bt
  JOIN tags t ON t.id = bt.tag_id
  LEFT JOIN book_tags user_bt
    ON user_bt.book_id = bt.book_id
   AND user_bt.tag_id = bt.tag_id
   AND user_bt.user_id = ?
  WHERE bt.book_id = ?
  ORDER BY t.name
`
    )
    .all(userId, book.id);

  const reviews = db
    .prepare(
      `
    SELECT
      u.display_name,
      u.username,
      r.rating,
      r.review,
      r.created_at
    FROM ratings r
    JOIN users u ON u.id = r.user_id
    WHERE r.book_id = ?
      AND r.review IS NOT NULL
      AND TRIM(r.review) != ''
    ORDER BY r.created_at DESC
  `
    )
    .all(book.id);
  const averageRating = db
    .prepare(
      `
    SELECT AVG(rating) AS average_rating
    FROM ratings
    WHERE book_id = ?
      AND rating IS NOT NULL
  `
    )
    .get(book.id);
  console.log(averageRating);
  return (
    <main className={styles.page}>
      <section className={styles.bookHeader}>
        {book.cover_url && (
          <img
            className={styles.cover}
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
          />
        )}

        <div className={styles.bookInfo}>
          <h1>{book.title}</h1>
          <p className={styles.author}>{book.author}</p>

          <div className={styles.buttons}>
            <ReadBookModal book={book} markRead={markRead} />
            <form action={addToRead}>
              <input type="hidden" name="bookId" value={book.id} />

              <button type="submit" className="primaryButton">Want to Read</button>
            </form>
          </div>
        </div>
      </section>
      <div className={styles.tags}>
        {(tags ?? []).map((tag) => (
          <form key={tag.id} action={addUserTag}>
            <input type="hidden" name="bookId" value={book.id} />
            <input type="hidden" name="tagName" value={tag.name} />

            <button
              type="submit"
              className={
                Number(tag.selected) === 1 ? styles.tagSelected : styles.tag
              }
            >
              {tag.name}
            </button>
          </form>
        ))}
        <AddTagButton bookId={book.id} addUserTag={addUserTag} />
      </div>
      <section className={styles.description}>
        <p>{book.description || "No description available."}</p>
      </section>

      <section className={styles.stats}>
        <div>{averageRating.average_rating ?? "—"} Average Rating</div>
        <div>
          {" "}
          {reviews.length} Review{reviews.length === 1 ? "" : "s"}
        </div>
        <div>22 Book Clubs have read this book</div>
      </section>

      {reviews.length > 0 && (
        <section className={styles.reviews}>
          {reviews.map((review) => (
            <div
              className={styles.review}
              key={`${review.username}-${review.created_at}`}
            >
              <strong>{review.display_name ?? review.username}</strong>
              <span>{review.rating}</span>
              <p>{review.review}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
