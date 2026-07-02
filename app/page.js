/**
This page returns a list of books. Either a list of books read, a list of books to read, or a ist of books in browsing format
 */
import styles from "./page.module.css";
import {
  loginUser,
  createUser,
  getCurrentUserId,
} from "/project/workspace/app/actions.js";
import NewUserModal from "/project/workspace/app/components/NewUserModal.js";
import Link from "next/link";

export default async function Home() {
  const userId = await getCurrentUserId();

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <h1>Books</h1>
        <p>🔥 Let's get started! 🔥</p>
      </section>
      {userId ? (
        <aside className={styles.sidebar}>
          <h2>Welcome back!</h2>
          <Link href="/books?type=library">Go to your library</Link>
        </aside>
      ) : (
        <aside className={styles.sidebar}>
          <h2>Sign In</h2>

          <form action={loginUser} className={styles.loginForm}>
            <label>
              Email
              <input type="email" name="email" />
            </label>

            <label>
              Password
              <input type="password" name="password" />
            </label>

            <button type="submit" className={styles.loginButton}>
              SIGN IN
            </button>
          </form>
          <div className={styles.divider}></div>

          <h3>New User</h3>

          <NewUserModal createUser={createUser} />
        </aside>
      )}
    </main>
  );
}
