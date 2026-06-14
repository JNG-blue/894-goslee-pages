import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";

const db = new Database("./data/app.db");
db.pragma("foreign_keys = ON");

const TEST_PREFIX = "__TEST_SCHEMA__";

function cleanup() {
  db.prepare(
    `
    DELETE FROM book_tags
    WHERE book_id IN (SELECT id FROM books WHERE title LIKE ?)
       OR tag_id IN (SELECT id FROM tags WHERE name LIKE ?)
       OR user_id IN (SELECT id FROM users WHERE username LIKE ?)
  `
  ).run(`${TEST_PREFIX}%`, `${TEST_PREFIX}%`, `${TEST_PREFIX}%`);

  db.prepare(
    `
    DELETE FROM ratings
    WHERE user_id IN (SELECT id FROM users WHERE username LIKE ?)
       OR book_id IN (SELECT id FROM books WHERE title LIKE ?)
  `
  ).run(`${TEST_PREFIX}%`, `${TEST_PREFIX}%`);

  db.prepare(`DELETE FROM tags WHERE name LIKE ?`).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM books WHERE title LIKE ?`).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM users WHERE username LIKE ?`).run(`${TEST_PREFIX}%`);
}
beforeEach(cleanup);
afterEach(cleanup);

describe("real users table", () => {
  it("creates a user", () => {
    db.prepare(
      `
      INSERT INTO users (username, email, display_name)
      VALUES (?, ?, ?)
    `
    ).run(
      `${TEST_PREFIX}_user_1`,
      `${TEST_PREFIX}_user_1@example.com`,
      "Test User"
    );

    const user = db
      .prepare(
        `
      SELECT username, email, display_name
      FROM users
      WHERE username = ?
    `
      )
      .get(`${TEST_PREFIX}_user_1`);

    expect(user.display_name).toBe("Test User");
  });

  it("rejects duplicate usernames", () => {
    db.prepare(
      `
      INSERT INTO users (username, email)
      VALUES (?, ?)
    `
    ).run(`${TEST_PREFIX}_dupe`, `${TEST_PREFIX}_dupe1@example.com`);

    expect(() => {
      db.prepare(
        `
        INSERT INTO users (username, email)
        VALUES (?, ?)
      `
      ).run(`${TEST_PREFIX}_dupe`, `${TEST_PREFIX}_dupe2@example.com`);
    }).toThrow();
  });
});

describe("real books table", () => {
  it("creates a book", () => {
    db.prepare(
      `
      INSERT INTO books (title, author, isbn, pub_year)
      VALUES (?, ?, ?, ?)
    `
    ).run(
      `${TEST_PREFIX}_book_1`,
      "Test Author",
      `${TEST_PREFIX}_isbn_1`,
      2024
    );

    const book = db
      .prepare(
        `
      SELECT title, author, isbn, pub_year
      FROM books
      WHERE isbn = ?
    `
      )
      .get(`${TEST_PREFIX}_isbn_1`);

    expect(book.author).toBe("Test Author");
    expect(book.pub_year).toBe(2024);
  });

  it("rejects duplicate ISBNs", () => {
    db.prepare(
      `
      INSERT INTO books (title, isbn)
      VALUES (?, ?)
    `
    ).run(`${TEST_PREFIX}_book_a`, `${TEST_PREFIX}_same_isbn`);

    expect(() => {
      db.prepare(
        `
        INSERT INTO books (title, isbn)
        VALUES (?, ?)
      `
      ).run(`${TEST_PREFIX}_book_b`, `${TEST_PREFIX}_same_isbn`);
    }).toThrow();
  });
});

describe("real ratings table", () => {
  function seedUserAndBook() {
    const userResult = db
      .prepare(
        `
      INSERT INTO users (username, email)
      VALUES (?, ?)
    `
      )
      .run(
        `${TEST_PREFIX}_rating_user_${Date.now()}`,
        `${TEST_PREFIX}_rating_user_${Date.now()}@example.com`
      );

    const bookResult = db
      .prepare(
        `
      INSERT INTO books (title, isbn)
      VALUES (?, ?)
    `
      )
      .run(
        `${TEST_PREFIX}_rating_book_${Date.now()}`,
        `${TEST_PREFIX}_rating_isbn_${Date.now()}`
      );

    return {
      userId: userResult.lastInsertRowid,
      bookId: bookResult.lastInsertRowid,
    };
  }

  it("allows to-read with null rating", () => {
    const { userId, bookId } = seedUserAndBook();

    db.prepare(
      `
      INSERT INTO ratings (user_id, book_id, rating, readstatus)
      VALUES (?, ?, ?, ?)
    `
    ).run(userId, bookId, null, 2);

    const rating = db
      .prepare(
        `
      SELECT rating, readstatus
      FROM ratings
      WHERE user_id = ? AND book_id = ?
    `
      )
      .get(userId, bookId);

    expect(rating.rating).toBe(null);
    expect(rating.readstatus).toBe(2);
  });

  it("rejects ratings outside 1-10", () => {
    const { userId, bookId } = seedUserAndBook();

    expect(() => {
      db.prepare(
        `
        INSERT INTO ratings (user_id, book_id, rating, readstatus)
        VALUES (?, ?, ?, ?)
      `
      ).run(userId, bookId, 11, 1);
    }).toThrow();
  });

  it("rejects duplicate user/book rating rows", () => {
    const { userId, bookId } = seedUserAndBook();

    db.prepare(
      `
      INSERT INTO ratings (user_id, book_id, rating, readstatus)
      VALUES (?, ?, ?, ?)
    `
    ).run(userId, bookId, 8, 1);

    expect(() => {
      db.prepare(
        `
        INSERT INTO ratings (user_id, book_id, rating, readstatus)
        VALUES (?, ?, ?, ?)
      `
      ).run(userId, bookId, 9, 1);
    }).toThrow();
  });
});

describe("real tags table", () => {
  it("creates a tag", () => {
    const tagName = `${TEST_PREFIX}_tag_${Date.now()}`;

    db.prepare(
      `
      INSERT INTO tags (name)
      VALUES (?)
    `
    ).run(tagName);

    const tag = db
      .prepare(
        `
      SELECT name
      FROM tags
      WHERE name = ?
    `
      )
      .get(tagName);

    expect(tag.name).toBe(tagName);
  });

  it("rejects duplicate tag names", () => {
    const tagName = `${TEST_PREFIX}_dupe_tag_${Date.now()}`;

    db.prepare(
      `
      INSERT INTO tags (name)
      VALUES (?)
    `
    ).run(tagName);

    expect(() => {
      db.prepare(
        `
        INSERT INTO tags (name)
        VALUES (?)
      `
      ).run(tagName);
    }).toThrow();
  });
});

describe("real book_tags table", () => {
  function seedUserBookAndTag() {
    const stamp = Date.now();

    const userResult = db
      .prepare(
        `
      INSERT INTO users (username, email)
      VALUES (?, ?)
    `
      )
      .run(
        `${TEST_PREFIX}_bt_user_${stamp}`,
        `${TEST_PREFIX}_bt_user_${stamp}@example.com`
      );

    const bookResult = db
      .prepare(
        `
      INSERT INTO books (title, isbn)
      VALUES (?, ?)
    `
      )
      .run(
        `${TEST_PREFIX}_bt_book_${stamp}`,
        `${TEST_PREFIX}_bt_isbn_${stamp}`
      );

    const tagResult = db
      .prepare(
        `
      INSERT INTO tags (name)
      VALUES (?)
    `
      )
      .run(`${TEST_PREFIX}_bt_tag_${stamp}`);

    return {
      userId: userResult.lastInsertRowid,
      bookId: bookResult.lastInsertRowid,
      tagId: tagResult.lastInsertRowid,
    };
  }

  it("connects a book, tag, and user", () => {
    const { userId, bookId, tagId } = seedUserBookAndTag();

    db.prepare(
      `
      INSERT INTO book_tags (book_id, tag_id, user_id)
      VALUES (?, ?, ?)
    `
    ).run(bookId, tagId, userId);

    const row = db
      .prepare(
        `
      SELECT book_id, tag_id, user_id
      FROM book_tags
      WHERE book_id = ?
        AND tag_id = ?
        AND user_id = ?
    `
      )
      .get(bookId, tagId, userId);

    expect(row).toEqual({
      book_id: bookId,
      tag_id: tagId,
      user_id: userId,
    });
  });

  it("rejects duplicate book/tag/user intersections", () => {
    const { userId, bookId, tagId } = seedUserBookAndTag();

    db.prepare(
      `
      INSERT INTO book_tags (book_id, tag_id, user_id)
      VALUES (?, ?, ?)
    `
    ).run(bookId, tagId, userId);

    expect(() => {
      db.prepare(
        `
        INSERT INTO book_tags (book_id, tag_id, user_id)
        VALUES (?, ?, ?)
      `
      ).run(bookId, tagId, userId);
    }).toThrow();
  });

  it("allows same book and tag for different users", () => {
    const { userId, bookId, tagId } = seedUserBookAndTag();
    const stamp = Date.now();

    const secondUser = db
      .prepare(
        `
      INSERT INTO users (username, email)
      VALUES (?, ?)
    `
      )
      .run(
        `${TEST_PREFIX}_bt_user_2_${stamp}`,
        `${TEST_PREFIX}_bt_user_2_${stamp}@example.com`
      ).lastInsertRowid;

    db.prepare(
      `
      INSERT INTO book_tags (book_id, tag_id, user_id)
      VALUES (?, ?, ?)
    `
    ).run(bookId, tagId, userId);

    db.prepare(
      `
      INSERT INTO book_tags (book_id, tag_id, user_id)
      VALUES (?, ?, ?)
    `
    ).run(bookId, tagId, secondUser);

    const count = db
      .prepare(
        `
      SELECT COUNT(*) AS count
      FROM book_tags
      WHERE book_id = ?
        AND tag_id = ?
    `
      )
      .get(bookId, tagId).count;

    expect(count).toBe(2);
  });

  it("rejects invalid book_id", () => {
    const { userId, tagId } = seedUserBookAndTag();

    expect(() => {
      db.prepare(
        `
        INSERT INTO book_tags (book_id, tag_id, user_id)
        VALUES (?, ?, ?)
      `
      ).run(99999999, tagId, userId);
    }).toThrow();
  });

  it("rejects invalid tag_id", () => {
    const { userId, bookId } = seedUserBookAndTag();

    expect(() => {
      db.prepare(
        `
        INSERT INTO book_tags (book_id, tag_id, user_id)
        VALUES (?, ?, ?)
      `
      ).run(bookId, 99999999, userId);
    }).toThrow();
  });

  it("rejects invalid user_id", () => {
    const { bookId, tagId } = seedUserBookAndTag();

    expect(() => {
      db.prepare(
        `
        INSERT INTO book_tags (book_id, tag_id, user_id)
        VALUES (?, ?, ?)
      `
      ).run(bookId, tagId, 99999999);
    }).toThrow();
  });
});
