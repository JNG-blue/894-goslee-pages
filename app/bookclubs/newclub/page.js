import styles from "./NewClub.module.css";
import { createClub } from "./actions";

export default function NewClubPage() {
  return (
    <main className={styles.page}>
      <h1>Create a new club</h1>

      <p className={styles.intro}>
        So you want to create a new book club? That is great!
      </p>

      <form action={createClub} className={styles.form}>
        <p>
          <label>Club Name</label>

          <input type="text" name="name" required />
        </p>
        <p>
          <label>
            Describe your club.
            <br />
            Are you fantasy enthusiasts? Local to your small town?
          </label>

          <textarea name="description" rows="5" />
        </p>

        <label>
          Is this a private club? Private clubs can only be joined with your
          permission and their meetings and conversations will only be seen by
          members.
        </label>

        <input type="checkbox" name="private" />

        <p>
          <button className="primaryButton">Create</button>
        </p>
      </form>
    </main>
  );
}
