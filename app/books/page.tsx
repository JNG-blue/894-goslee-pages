import Database from "better-sqlite3";
import BookRow from "@/app/components/BookRow.js";

import { cookies } from "next/headers";
import {
  getCurrentUserId,
  getCurrentUser,
} from "@/app/actions.js";

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
  userId,
  page: number = 1,
  pageSize: number = 25
): Promise<{ books: Book[]; total: number; totalPages: number }> {
  const db = new Database("./data/app.db");

  const offset = (page - 1) * pageSize;

  const baseSelect = `
    SELECT b.id, b.title, b.author, b.average_rating, b.cover_url, b.pub_year, b.openlibrary_engagement
    FROM books b
  `;

  let whereSql = "";
  let joinSql = "";
  let orderSql = "order by b.openlibrary_engagement DESC, b.title ASC";
  let args: any[] = [];

  if (type === "search" && query.trim()) {
    const search = `%${query.trim()}%`;
    whereSql = `
      WHERE b.title LIKE ?
         OR b.author LIKE ?
         OR b.description LIKE ?
    `;
    args = [search, search, search];
  }

  if (type === "toread") {
    joinSql = "JOIN ratings r ON r.book_id = b.id";
    whereSql = `
      WHERE r.user_id = ?
        AND r.readstatus = 2
    `;
    orderSql = "ORDER BY r.created_at DESC";
    args = [userId];
  }

  if (type === "library") {
    joinSql = "JOIN ratings r ON r.book_id = b.id";
    whereSql = `
      WHERE r.user_id = ?
        AND r.readstatus = 1
    `;
    orderSql = "ORDER BY r.created_at DESC";
    args = [userId];
  }

  const total = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM books b
      ${joinSql}
      ${whereSql}
    `
    )
    .get(...args) as { count: number };

  const books = db
    .prepare(
      `
      ${baseSelect}
      ${joinSql}
      ${whereSql}
      ${orderSql}
      LIMIT ?
      OFFSET ?
    `
    )
    .all(...args, pageSize, offset) as Book[];

  return {
    books,
    total: total.count,
    totalPages: Math.ceil(total.count / pageSize),
  };
}

export default async function BooksPage({ searchParams }) {
  const params = await searchParams;

const type = params.type ?? "browse";
const query = params.query ?? "";
const page = Math.max(Number(params.page ?? "1"), 1);
const pageSize = 25;

const userId = await getCurrentUserId();
const { books, totalPages } = await getBooks(type, query, userId, page, pageSize);

  const cookieStore = await cookies();
  console.log(cookieStore.get("user_id"));
  console.log("Books.length", books.length);

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

      <nav>
        {page > 1 && (
          <a
            href={`/books?type=${encodeURIComponent(type)}&query=${encodeURIComponent(
              query
            )}&page=${page - 1}`}
          >
            Previous
          </a>
        )}

        <span>
          Page {page} of {totalPages}
        </span>

        {page < totalPages && (
          <a
            href={`/books?type=${encodeURIComponent(type)}&query=${encodeURIComponent(
              query
            )}&page=${page + 1}`}
          >
            Next
          </a>
        )}
      </nav>
    </main>
  );
}
