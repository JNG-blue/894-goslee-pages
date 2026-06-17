import Link from "next/link";
import styles from "./ClubRow.module.css";

export default function ClubRow({ club }) {
  return (
    <Link href={`/bookclubs/${club.id}`} className={styles.clubRow}>
      <div>
        <h2>
          {club.is_member == 1 && <span>🔥</span>}
          {club.name}
        </h2>
        <p>{club.is_member == 0 && club.description}</p>
      </div>

      <div className={styles.meta}>
        <span>{club.member_count} members</span>
        <span>{club.public ? "Public" : "Private"}</span>
      </div>
    </Link>
  );
}
