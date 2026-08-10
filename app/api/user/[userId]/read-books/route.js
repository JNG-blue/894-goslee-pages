import Database from "better-sqlite3";

const db = new Database("./data/app.db");

function csvEscape(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}



export async function GET(request, { params }) {
  const books = db
    .prepare(
      `
        SELECT
          books.title,
          books.author,
          ratings.rating,
          ratings.review,
          ratings.created_at
        FROM ratings
        JOIN books ON books.id = ratings.book_id
        WHERE ratings.user_id = ?
          AND ratings.readstatus = 1
        ORDER BY ratings.created_at DESC
      `
    )
    .all(params.userId);

  const header = ["Title", "Author", "Rating", "Review","Read Date"];

  const rows = books.map((book) => [
    book.title,
    book.author,
    book.rating,
    book.review,
    book.created_at
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="read-books-${params.userId}.csv"`,
    },
  });
}
