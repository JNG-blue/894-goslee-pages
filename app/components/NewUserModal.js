"use client";

import { useState } from "react";

export default function NewUserModal({ createUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="primaryButton" onClick={() => setOpen(true)}>
        Create new account
      </button>

      {open && (
        <div className="modalBackdrop">
          <div className="modal">
            <h2>Create Account</h2>

            <form action={createUser}>
              <label>
                Email Address
                <input type="email" name="email" required />
              </label>

              <label>
                Display Name
                <input type="text" name="displayName" required />
              </label>

              <label>
                Password
                <input type="password" name="password" required />
              </label>

              <button type="button" className="primaryButton" onClick={() => setOpen(false)}>
                Cancel
              </button>

              <button className="primaryButton" type="submit">Create Account</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}