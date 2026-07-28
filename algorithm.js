const Database = require("better-sqlite3");

const db = new Database("data/app.db");

const userId = 8;

db.exec(`DROP TABLE IF EXISTS scored_books;`);

// Step 1, 2, 3: create scored temp table
db.exec(`
  CREATE TEMP TABLE scored_books AS
  WITH ranked_books AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY openlibrary_engagement DESC
      ) AS popularity_rank
    FROM books
  )
  SELECT
    b.*,
    rb.popularity_rank,
    CASE
      WHEN rb.popularity_rank <= 1000
        THEN ROUND(2000 - ((rb.popularity_rank - 1) * (1000.0 / 999)))
      ELSE 500
    END AS score,
      1 AS friend_boost,
    1 AS author_boost
  FROM books b
  JOIN ranked_books rb
    ON rb.id = b.id;
`);

let result = db.prepare(`
  SELECT title, author, score, friend_boost, author_boost, openlibrary_engagement
  FROM scored_books
  ORDER BY score DESC
  LIMIT 15
`).all();

console.table(result);

// Step 4. Books read by people this user follows

db.prepare(`
  UPDATE scored_books
  SET friend_boost = 4
  WHERE id IN (
    SELECT
      r.book_id
    FROM friends f
    JOIN ratings r
      ON r.user_id = f.subscription_id
     AND r.readstatus = 1
    WHERE f.user_id = ?
  );
`).run(userId);

result = db.prepare(`
  SELECT title, author, score, friend_boost, author_boost, openlibrary_engagement
  FROM scored_books
  ORDER BY score DESC
  LIMIT 15
`).all();

console.table(result);

// Boost unread books by authors this user has read and rated higher than 6
db.prepare(`
  UPDATE scored_books
  SET author_boost = author_boost*4
  WHERE author IN (
    SELECT DISTINCT b.author
    FROM ratings r
    JOIN books b
      ON b.id = r.book_id
    WHERE r.user_id = ?
      AND r.readstatus = 1
      AND r.rating > 6
  )
  AND id NOT IN (
    SELECT book_id
    FROM ratings
    WHERE user_id = ?
  );
`).run(userId, userId);

//deboost authors the reader doesn't like
// Boost unread books by authors this user has read and rated higher than 6
db.prepare(`
  UPDATE scored_books
  SET author_boost = author_boost*.4
  WHERE author IN (
    SELECT DISTINCT b.author
    FROM ratings r
    JOIN books b
      ON b.id = r.book_id
    WHERE r.user_id = ?
      AND r.readstatus = 1
      AND r.rating < 5
  )
  AND id NOT IN (
    SELECT book_id
    FROM ratings
    WHERE user_id = ?
  );
`).run(userId, userId);

result = db.prepare(`
  SELECT id,title, author, score, friend_boost, author_boost, openlibrary_engagement
  FROM scored_books
  ORDER BY score*friend_boost*author_boost DESC
  LIMIT 40
`).all();

console.table(result);
// Step 7 get rid of everything not in the top 500
db.exec(`
  DELETE FROM scored_books
  WHERE id NOT IN (
    SELECT id
    FROM scored_books
    ORDER BY score * friend_boost * author_boost DESC
    LIMIT 500
  );
`);

const bookId = 152;

result = db.prepare(`
  WITH tag_usage AS (
    SELECT
      tag_id,
      COUNT(*) AS usage_count
    FROM book_tags
    GROUP BY tag_id
  )
  SELECT
    t.id,
    t.name,
    tu.usage_count
  FROM book_tags bt
  JOIN tags t
    ON t.id = bt.tag_id
  JOIN tag_usage tu
    ON tu.tag_id = bt.tag_id
  WHERE bt.book_id = ?
  ORDER BY tu.usage_count DESC, t.name;
`).all(bookId);

console.table(result);
