import styles from "./BookRow.module.css";
import Link from "next/link";
export default function BookRow({ book }) {
  return (
    <Link href={`/books/${book.id}`} className={styles.bookRow}>
      <img className={styles.bookCover} src={book.cover_url} alt={book.title} />

      <div className={styles.bookTitle}>{book.title}</div>

      <div className={styles.bookAuthor}>{book.author}</div>

      <div className={styles.bookYear}>{book.pub_year}</div>

      <div className={styles.average_rating}>{book.average_rating}</div>
    </Link>
  );
}
