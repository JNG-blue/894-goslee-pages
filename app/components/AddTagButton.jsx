"use client";

import { useState } from "react";

export default function AddTagButton({ bookId, addUserTag }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)}>
        +
      </button>
    );
  }

  return (
    <form action={addUserTag}>
      <input type="hidden" name="bookId" value={bookId} />

      <input name="tagName" autoFocus placeholder="tag" />
    </form>
  );
}
