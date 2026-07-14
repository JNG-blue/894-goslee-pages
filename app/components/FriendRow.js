import Link from "next/link";
import styles from "./ClubRow.module.css";

export default function FriendRow({ friend }) {
  return (
    <Link href={`/user/${friend.id}`} className={styles.clubRow}>
      <div>
        <h2>
          {friend.display_name} ({friend.username}) {friend.books_read} books.
        </h2>
      </div>
    </Link>
  );
}
