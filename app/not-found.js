import Link from "next/link";

export default function NotFound() {
  return (
    <main className={styles.notFound}>
      <h1>404</h1>

      <h2>Page Not Found</h2>

      <p>The page you're looking for doesn't exist or may have been moved.</p>

      <div className={styles.links}>
        <Link href="/">Home</Link>
        <Link href="/browse">Browse Books</Link>
      </div>
    </main>
  );
}
