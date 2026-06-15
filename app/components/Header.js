"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();

    router.push(`/books?type=search&query=${encodeURIComponent(query)}`);
  }

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <Link href="/" className={styles.logo}>
          PAGES
        </Link>

        <form onSubmit={handleSubmit}>
          <input
            className={styles.search}
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <nav className={styles.nav}>
        <Link href="/bookclubs">Clubs</Link>
        <Link href="/books?type=library" prefetch={false}>
          Library
        </Link>
        <a href="/books?type=toread">To-Read</a>
        <Link href="/friends">Friends</Link>
        <Link href="/books?type=browse" prefetch={false}>
          Browse
        </Link>
      </nav>
    </header>
  );
}
