const Database = require("better-sqlite3");

const db = new Database("data/app.db");
db.pragma("foreign_keys = ON");

const DEFAULT_USER_ID = 0;
const LIMIT_PER_SUBJECT = 100;
const PAGES_PER_SUBJECT = 5;

const subjects = [
  "classics",
  "literary fiction",
  "contemporary fiction",
  "adventure",
  "thriller",
  "crime",
  "detective",
  "dystopian",
  "paranormal",
  "urban fantasy",
  "epic fantasy",
  "high fantasy",
  "space opera",
  "cyberpunk",
  "steampunk",
  "time travel",
  "post apocalyptic",
  "war",
  "western",
  "humor",
  "drama",
  "poetry",
  "plays",
  "short stories",
  "nonfiction",
  "biography",
  "autobiography",
  "memoir",
  "history",
  "world history",
  "american history",
  "european history",
  "ancient history",
  "military history",
  "science",
  "popular science",
  "physics",
  "biology",
  "astronomy",
  "mathematics",
  "psychology",
  "philosophy",
  "religion",
  "mythology",
  "politics",
  "economics",
  "business",
  "self help",
  "health",
  "medicine",
  "cooking",
  "travel",
  "art",
  "music",
  "film",
  "technology",
  "computer science",
  "programming",
];

const fields = [
  "key",
  "title",
  "author_name",
  "isbn",
  "first_publish_year",
  "cover_i",
  "ratings_average",
  "readinglog_count",
  "subject",
].join(",");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "LibTesting/1.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${url}`);
  }

  return res.json();
}

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function pickIsbn(isbns) {
  if (!Array.isArray(isbns) || isbns.length === 0) return null;
  return isbns.find((isbn) => String(isbn).length === 13) || isbns[0];
}

function coverUrlFromDoc(doc) {
  return doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
    : null;
}

db.prepare(
  `
  INSERT OR IGNORE INTO users (
    id,
    username,
    email,
    display_name,
    password_hash
  )
  VALUES (
    0,
    'default',
    'default@local',
    'Default User',
    NULL
  )
`
).run();

const importBook = db.transaction((doc) => {
  const title = doc.title?.trim();
  const author = doc.author_name?.[0]?.trim() || "Unknown Author";

  if (!title) {
    return { skipped: true, reason: "missing title" };
  }
  if (!doc.cover_i) return { skipped: true, reason: "missing cover" };
  if (!doc.readinglog_count || doc.readinglog_count < 5) {
    return { skipped: true, reason: "low engagement" };
  }

  const isbn = pickIsbn(doc.isbn);
  const pubYear = doc.first_publish_year || null;
  const coverUrl = coverUrlFromDoc(doc);
  const averageRating =
    typeof doc.ratings_average === "number" ? doc.ratings_average : null;
  const openlibraryEngagement = doc.readinglog_count || 0;

  const existing =
    (isbn && db.prepare("SELECT id FROM books WHERE isbn = ?").get(isbn)) ||
    db
      .prepare("SELECT id FROM books WHERE title = ? AND author = ?")
      .get(title, author);

  let bookId;
  let created = false;

  if (existing) {
    bookId = existing.id;

    db.prepare(
      `
      UPDATE books
      SET openlibrary_engagement = MAX(COALESCE(openlibrary_engagement, 0), ?),
          isbn = COALESCE(isbn, ?),
          pub_year = COALESCE(pub_year, ?),
          cover_url = COALESCE(cover_url, ?),
          average_rating = COALESCE(?, average_rating)
      WHERE id = ?
    `
    ).run(
      openlibraryEngagement,
      isbn,
      pubYear,
      coverUrl,
      averageRating,
      bookId
    );
  } else {
    const result = db
      .prepare(
        `
      INSERT INTO books (
        title,
        author,
        openlibrary_engagement,
        isbn,
        pub_year,
        description,
        cover_url,
        average_rating
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        title,
        author,
        openlibraryEngagement,
        isbn,
        pubYear,
        null,
        coverUrl,
        averageRating
      );

    bookId = result.lastInsertRowid;
    created = true;
  }

  const tags = Array.from(
    new Set((doc.subject || []).map(normalizeTag))
  ).filter(Boolean);

  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
  const getTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const linkTag = db.prepare(`
    INSERT OR IGNORE INTO book_tags (book_id, tag_id, user_id)
    VALUES (?, ?, ?)
  `);

  for (const tag of tags) {
    insertTag.run(tag);
    const tagRow = getTag.get(tag);
    linkTag.run(bookId, tagRow.id, DEFAULT_USER_ID);
  }

  return {
    skipped: false,
    created,
    bookId,
    title,
    author,
    tagCount: tags.length,
  };
});

async function importSubject(subject) {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let tagsLinked = 0;
  let found = 0;

  for (let page = 1; page <= PAGES_PER_SUBJECT; page++) {
    const params = new URLSearchParams({
      subject,
      sort: "readinglog",
      limit: String(LIMIT_PER_SUBJECT),
      page: String(page),
      fields,
    });

    const url = `https://openlibrary.org/search.json?${params}`;
    const data = await getJson(url);
    const docs = data.docs || [];

    found += docs.length;

    if (docs.length === 0) break;

    for (const doc of docs) {
      const result = importBook(doc);

      if (result.skipped) {
        skipped += 1;
        continue;
      }

      if (result.created) created += 1;
      else updated += 1;

      tagsLinked += result.tagCount;
    }

    await sleep(300);
  }

  return { subject, found, created, updated, skipped, tagsLinked };
}

async function main() {
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalTagsLinked = 0;

  for (const subject of subjects) {
    console.log(`Importing subject: ${subject}`);

    const result = await importSubject(subject);

    totalCreated += result.created;
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
    totalTagsLinked += result.tagsLinked;

    console.log(result);

    await sleep(500);
  }

  console.log("Bulk import complete.");
  console.log({
    totalCreated,
    totalUpdated,
    totalSkipped,
    totalTagsLinked,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
