import styles from "./page.module.css";
import Database from "better-sqlite3";
import { acceptInvitation, rejectInvitation } from "./actions.js";
import { getCurrentUserId } from "/project/workspace/app/actions.js";

const db = new Database("./data/app.db");

export default async function InvitationsPage() {
  const currentUserId = await getCurrentUserId();

  const invitations = db
    .prepare(
      `
    SELECT
      invitations.id,
      invitations.bookclub_id,
      invitations.from_user_id,
      invitations.to_user_id,
      invitations.status,
      invitations.created_at,
      invitations.responded_at,

      from_user.username AS from_username,
      from_user.display_name AS from_display_name,

      to_user.username AS to_username,
      to_user.display_name AS to_display_name,

      bookclubs.name AS bookclub_name

    FROM invitations

    JOIN users AS from_user
      ON invitations.from_user_id = from_user.id

    JOIN users AS to_user
      ON invitations.to_user_id = to_user.id

    JOIN bookclubs
      ON invitations.bookclub_id = bookclubs.id

    WHERE invitations.responded_at IS NULL
      AND (
        invitations.from_user_id = ?
        OR invitations.to_user_id = ?
      )

    ORDER BY invitations.created_at DESC
  `
    )
    .all(currentUserId, currentUserId);

  const sent = invitations.filter((i) => i.from_user_id === currentUserId);
  const received = invitations.filter((i) => i.to_user_id === currentUserId);

  return (
    <main className={styles.page}>
      <h1>Invitations</h1>

      <section>
        <h2>Received</h2>

        {received.length === 0 && (
          <p className={styles.empty}>No pending received invitations.</p>
        )}

        {received.map((invite) => (
          <div key={invite.id} className={styles.invite}>
            <div>
              <strong>{invite.bookclub_name}</strong>
              <p>
                From{" "}
                {invite.from_display_name ||
                  invite.from_username ||
                  `User ${invite.from_user_id}`}
              </p>
            </div>

            <div className={styles.actions}>
              <form action={acceptInvitation}>
                <input type="hidden" name="invitationId" value={invite.id} />
                <button type="submit">Accept</button>
              </form>

              <form action={rejectInvitation}>
                <input type="hidden" name="invitationId" value={invite.id} />
                <button type="submit" className={styles.reject}>
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Sent</h2>

        {sent.length === 0 && (
          <p className={styles.empty}>No pending sent invitations.</p>
        )}

        {sent.map((invite) => (
          <div key={invite.id} className={`${styles.invite} ${styles.sent}`}>
            <div>
              <strong>{invite.bookclub_name}</strong>
              <p>
                Sent to{" "}
                {invite.to_display_name ||
                  invite.to_username ||
                  `User ${invite.to_user_id}`}
              </p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
