import Database from "better-sqlite3";
import styles from "./OneBook.module.css";
import AddTagButton from "/project/workspace/app/components/AddTagButton";
import { addToRead, addUserTag } from "./actions";

export default function OneBook({ params }) {
  const db = new Database("./data/app.db");

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
    .get(params.bookslug);

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
   AND user_bt.user_id = 1
  WHERE bt.book_id = ?
  ORDER BY t.name
`
    )
    .all(book.id);

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
            <button>I've Read This Book</button>
            <form action={addToRead}>
              <input type="hidden" name="bookId" value={book.id} />

              <button type="submit">Want to Read</button>
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
        <div>{book.average_rating ?? "—"} Reviews</div>
        <div>22 Book Clubs have read this book</div>
      </section>

      <section className={styles.reviews}>
        <div className={styles.review}>
          <strong>Reviewer</strong>
          <span>7</span>
          <p>text text text</p>
        </div>

        <div className={styles.review}>
          <strong>Reviewer</strong>
          <span>9</span>
          <p>
            liked the book a lot hated the book said lots. Limit review to 200
            or so words.
          </p>
        </div>
      </section>
    </main>
  );
}
