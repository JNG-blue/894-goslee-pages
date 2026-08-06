const Database = require("better-sqlite3");

export function getRecommendedBookIds(userId, limit = 24) {
  const db = new Database("data/app.db");

  db.exec(`DROP TABLE IF EXISTS scored_books;`);

  //Step 1 & 2

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
      1 AS author_boost,
      1 AS tag_boost
    FROM books b
    JOIN ranked_books rb
      ON rb.id = b.id;
  `);
  //Step 2
  db.prepare(`
    DELETE FROM scored_books
    WHERE id IN (
      SELECT book_id
      FROM ratings
      WHERE user_id = ?
    );
  `).run(userId);
 //Step 4
  db.prepare(`
    UPDATE scored_books
    SET friend_boost = 4
    WHERE id IN (
      SELECT r.book_id
      FROM friends f
      JOIN ratings r
        ON r.user_id = f.subscription_id
       AND r.readstatus = 1
      WHERE f.user_id = ?
    );
  `).run(userId);
//Step 5 Boost Authors
  db.prepare(`
    UPDATE scored_books
    SET author_boost = author_boost * 4
    WHERE author IN (
      SELECT DISTINCT b.author
      FROM ratings r
      JOIN books b
        ON b.id = r.book_id
      WHERE r.user_id = ?
        AND r.readstatus = 1
        AND r.rating > 6
    );
  `).run(userId);
//Step 6 Deboost Authors
  db.prepare(`
    UPDATE scored_books
    SET author_boost = author_boost * 0.4
    WHERE author IN (
      SELECT DISTINCT b.author
      FROM ratings r
      JOIN books b
        ON b.id = r.book_id
      WHERE r.user_id = ?
        AND r.readstatus = 1
        AND r.rating < 5
    );
  `).run(userId);
// keep only the 1000 top books before tag step
  db.exec(`
    DELETE FROM scored_books
    WHERE id NOT IN (
      SELECT id
      FROM scored_books
      ORDER BY score * friend_boost * author_boost DESC
      LIMIT 1000
    );
  `);

  db.prepare(`
    UPDATE scored_books
    SET tag_boost = tag_boost + (
      SELECT COUNT(DISTINCT bt.tag_id)
      FROM book_tags bt
      JOIN user_tag_preferences p
        ON p.tag_id = bt.tag_id
      WHERE bt.book_id = scored_books.id
        AND p.user_id = ?
        AND p.preference = 1
    )
    WHERE EXISTS (
      SELECT 1
      FROM book_tags bt
      JOIN user_tag_preferences p
        ON p.tag_id = bt.tag_id
      WHERE bt.book_id = scored_books.id
        AND p.user_id = ?
        AND p.preference = 1
    );
  `).run(userId, userId);

  db.prepare(`
    UPDATE scored_books
    SET tag_boost = tag_boost * 0.7
    WHERE id IN (
      SELECT DISTINCT bt.book_id
      FROM book_tags bt
      JOIN user_tag_preferences p
        ON p.tag_id = bt.tag_id
      WHERE p.user_id = ?
        AND p.preference = -1
    );
  `).run(userId);

  const rows = db.prepare(`
    SELECT id
    FROM scored_books
    ORDER BY score * friend_boost * author_boost * tag_boost DESC
    LIMIT ?
  `).all(limit);

  db.close();

  return rows.map(row => row.id);
}

