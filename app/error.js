"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="error">
      <h1>An error occurred.</h1>

      <p>
        <strong>Name:</strong> {error.name}
      </p>
      <p>
        <strong>Message:</strong> {error.message}
      </p>
      <p>
        <strong>Digest:</strong> {error.digest}
      </p>

      <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>

      <button onClick={reset}>Try Again</button>
    </main>
  );
}
