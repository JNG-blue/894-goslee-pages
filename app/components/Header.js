"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";

export default function Header({ user }) {
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

        <div className={styles.searchArea}>
          <div className={styles.userBar}>
            <Link href={user?.id ? `/user/${user.id}` : "/"} className={styles.username}>
              {user?.display_name ?? user?.username ?? "Sign in"}
            </Link>
            <Link href="/invitations" className={styles.mail}>
              <FaEnvelope />
              <span className={styles.badge}>3</span>
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              className={styles.search}
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>
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
