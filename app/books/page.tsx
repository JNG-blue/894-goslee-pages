import Database from "better-sqlite3";
import BookRow from "/project/workspace/app/components/BookRow.js";

type Book = {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  description: string | null;
  cover_url: string | null;
  pub_year: number | null;
};

function getBooks(type: string, query: string = ""): Book[] {
  const db = new Database("./data/app.db");

  const baseSelect = `
    SELECT b.id, b.title, b.author, b.average_rating, b.description, b.cover_url, b.pub_year
    FROM books b
  `;

  if (type === "search" && query.trim()) {
    const search = `%${query.trim()}%`;

    return db
      .prepare(
        `
      ${baseSelect}
      WHERE b.title LIKE ?
         OR b.author LIKE ?
         OR b.description LIKE ?
      ORDER BY b.title ASC
    `
      )
      .all(search, search, search) as Book[];
  }

  if (type === "toread") {
    return db
      .prepare(
        `
      ${baseSelect}
      JOIN ratings r ON r.book_id = b.id
      WHERE r.user_id = ?
        AND r.readstatus = ?
      ORDER BY r.created_at desc
    `
      )
      .all(1, 2) as Book[]; //readstatus 2 indicates toreadbooks
  }

  if (type === "library") {
    return db
      .prepare(
        `
      ${baseSelect}
      JOIN ratings r ON r.book_id = b.id
      WHERE r.user_id = ?
        AND r.readstatus = ?
      ORDER BY r.created_at desc
    `
      )
      .all(1, 1) as Book[]; //readstatus 2 indicates toreadbooks
  }

  return db
    .prepare(
      `
    ${baseSelect}
    ORDER BY b.title ASC
  `
    )
    .all() as Book[];
}

export default function BooksPage({ searchParams }) {
  const type = searchParams.type ?? "browse";
  const query = searchParams.query ?? "";
  const books = getBooks(type, query);
  console.log(books.length);

  return (
    <main>
      <h1>
        {type} Books {query}
      </h1>

      <div>
        {books.map((book) => (
          <BookRow key={book.id} book={book} />
        ))}
      </div>
    </main>
  );
}
