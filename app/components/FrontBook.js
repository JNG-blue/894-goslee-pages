import Link from "next/link";
import styles from "./FrontBook.module.css";



export default function FrontBook({ book }) {
  return (
    <Link href={`/books/${book.id}`} className={styles.frontBook}>
      <img
        className={styles.bookCover}
        src={book.cover_url || "/placeholder-cover.png"}
        alt={book.title}
      />

<div className={styles.bookInfo}>
  <div className={styles.bookTitle}>
    {book.title} - {book.author}
  </div>

  <div className={styles.bookMeta}>
    <span>{new Date(book.created_at).toLocaleDateString()} </span>
    <span>{book.display_name} </span>
    {book.rating && <span>{book.rating}/10 </span>}
    {book.review && <span>{book.review} </span>}
  </div>
</div>
    </Link>
  );
}