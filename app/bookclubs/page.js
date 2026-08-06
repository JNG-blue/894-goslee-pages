import Database from "better-sqlite3";
import ClubRow from "../components/ClubRow";
import { getCurrentUser } from "../actions";
import Link from "next/link";
import styles from "@/app/bookclubs/[clubslug]/ClubPage.module.css";

async function getBookClubs() {
  const db = new Database("./data/app.db");
  const user = await getCurrentUser();
  const user_id = user?.id ?? user.id ?? 0;
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
          AND bcm2.user_id = ?
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
    .all(user_id);
}

export default async function BookClubsPage() {
  const clubs = await getBookClubs();

  return (
    <main>
      <h1>Book Clubs</h1>

      {clubs.map((club) => (
        <ClubRow key={club.id} club={club} />
      ))}
      <div>
        <Link href="/bookclubs/newclub" className="primaryButton">
          {" "}
          Create a New Club
        </Link>
      </div>
    </main>
  );
}
