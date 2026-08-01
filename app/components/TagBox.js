"use client";

import { useState, useTransition } from "react";
import { updateTagPreference } from "./actions.js";
import styles from "./TagBox.module.css";

  const TopTags = [
    'history', "children's fiction", 'new york times bestseller' , 'juvenile fiction',  'biography',
    'fantasy','science fiction', 'nonfiction','magic','psychology',
    'science','philosophy','american literature','drama','literature',
    'english literature','friendship', 'women','classic literature','families',
    ];

function getNextPreference(preference) {
  if (preference === 0) return 1;
  if (preference === 1) return -1;
  return 0;
}

export default function TagBox({ initialPreferences = {} }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();

  function handleTagClick(tagName) {
    const currentPreference = preferences[tagName] ?? 0;
    const nextPreference = getNextPreference(currentPreference);

    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [tagName]: nextPreference,
    }));

    startTransition(() => {
      updateTagPreference(tagName, nextPreference);
    });
  }

  return (
    <section className={styles.tagBox}>
      <div className={styles.grid}>
        {TopTags.slice(0, 25).map((tagName) => {
          const preference = preferences[tagName] ?? 0;

          return (
            <button
              key={tagName}
              type="button"
              disabled={isPending}
              className={[
                styles.tagButton,
                preference === 1 ? styles.liked : "",
                preference === -1 ? styles.disliked : "",
              ].join(" ")}
              onClick={() => handleTagClick(tagName)}
            >
              {tagName}
            </button>
          );
        })}
      </div>
    </section>
  );
}