import Database from "better-sqlite3";
import BookRow from "/project/workspace/app/components/BookRow.js";

import { cookies } from "next/headers";
import {
  getCurrentUserId,
  getCurrentUserName,
} from "/project/workspace/app/actions.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Book = {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  description: string | null;
  cover_url: string | null;
  pub_year: number | null;
};

export async function getBooks(
  type: string,
  query: string = "",
  userId
): Book[] {
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
        AND r.readstatus = 2
      ORDER BY r.created_at desc
    `
      )
      .all(userId) as Book[]; //readstatus 2 indicates toreadbooks
  }

  if (type === "library") {
    return db
      .prepare(
        `
      ${baseSelect}
      JOIN ratings r ON r.book_id = b.id
      WHERE r.user_id = ?
        AND r.readstatus = 1
      ORDER BY r.created_at desc
    `
      )
      .all(userId) as Book[]; //readstatus 2 indicates toreadbooks
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

export default async function BooksPage({ searchParams }) {
  const params = await searchParams;

  const type = params.type ?? "browse";
  console.log("type ", type);
  const query = params.query ?? "";
  const userId = await getCurrentUserId();
  const books = await getBooks(type, query, userId);
  const username = await getCurrentUserName();
  const cookieStore = await cookies();
  console.log(cookieStore.get("user_id"));
  console.log("Books.length", books.length);

  return (
    <main>
      <h1>
        {type} Books {query} {username}
      </h1>

      <div>
        {books.map((book) => (
          <BookRow key={book.id} book={book} />
        ))}
      </div>
    </main>
  );
}
