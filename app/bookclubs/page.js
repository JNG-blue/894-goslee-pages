import Database from "better-sqlite3";
import ClubRow from "../components/ClubRow";

function getBookClubs() {
  const db = new Database("./data/app.db");
  const user_id = 4;
  return db
    .prepare(
      `
      SELECT
      bc.id,
      bc.name,
      bc.description,
      bc.public,
      COUNT(DISTINCT bcm.user_id) AS member_count,
    
      EXISTS (
        SELECT 1
        FROM bookclub_members bcm2
        WHERE bcm2.bookclub_id = bc.id
          AND bcm2.user_id = 4
      ) AS is_member
    
    FROM bookclubs bc
    LEFT JOIN bookclub_members bcm
      ON bcm.bookclub_id = bc.id
    
    GROUP BY bc.id
    
    ORDER BY
      is_member DESC,
      bc.name ASC;
  `
    )
    .all();
}

export default function BookClubsPage() {
  const clubs = getBookClubs();

  return (
    <main>
      <h1>Book Clubs</h1>

      {clubs.map((club) => (
        <ClubRow key={club.id} club={club} />
      ))}
    </main>
  );
}
