"use client";

import { useState } from "react";

export default function ReadBookModal({ book, markRead }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        I've Read This Book
      </button>

      {open && (
        <div className="modalBackdrop">
          <div className="modal">
            <h2>{book.title}</h2>

            {book.cover_url && (
              <img src={book.cover_url} alt={book.title} width="100" />
            )}

            <p>{book.author}</p>

            <form action={markRead}>
              <input type="hidden" name="bookId" value={book.id} />

              <label>
                Rating
                <select name="rating" required>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} ★
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Review
                <textarea name="review" maxLength="1000" />
              </label>

              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>

              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
