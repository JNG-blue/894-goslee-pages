import styles from "./newthread.module.css";
import { createThread } from "./actions";

export default async function NewThreadPage({ params }) {
  const { clubslug } = await params;

  return (
    <main className={styles.page}>
      <h1>New Message</h1>

      <form action={createThread} className={styles.form}>
        <input type="hidden" name="clubId" value={clubslug} />

        <label>
          Title
          <input type="text" name="title" required />
        </label>

        <label>
          Meeting Date & Time
          <input type="datetime-local" name="meeting_time" />
        </label>

        <label>
          Location
          <input
            type="text"
            name="location"
            placeholder="Library, Zoom, Coffee Shop..."
          />
        </label>

        <label>
          Book Link
          <input
            type="text"
            name="booklink"
            placeholder="paste Pages url here..."
          />
        </label>

        <label>
          Description
          <textarea name="description" rows="6" />
        </label>

        <button type="submit">Create Message</button>
      </form>
    </main>
  );
}
