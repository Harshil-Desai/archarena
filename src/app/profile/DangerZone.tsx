"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        setDeleting(false);
        alert("Failed to delete account. Please try again.");
      }
    } catch {
      setDeleting(false);
      alert("Failed to delete account.");
    }
  }

  return (
    <div className="card p-5" style={{ marginTop: 16, borderColor: "color-mix(in oklch, var(--danger) 30%, var(--line-1))" }}>
      <span className="eyebrow" style={{ color: "var(--danger)" }}>Danger zone</span>
      <div className="row between" style={{ marginTop: 16, gap: 16 }}>
        <div className="col gap-1">
          <div style={{ fontSize: 13, color: "var(--text-1)" }}>Delete account</div>
          <div style={{ fontSize: 12, color: "var(--text-4)" }}>Permanently delete your account and all session data. This cannot be undone.</div>
        </div>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="btn btn-ghost"
            style={{ color: "var(--danger)", borderColor: "color-mix(in oklch, var(--danger) 40%, transparent)", flexShrink: 0 }}>
            Delete account
          </button>
        ) : (
          <div className="row gap-2" style={{ flexShrink: 0 }}>
            <button onClick={() => setConfirming(false)} className="btn btn-ghost" disabled={deleting}>
              Cancel
            </button>
            <button onClick={handleDelete} className="btn btn-ghost" disabled={deleting}
              style={{ color: "#fff", background: "var(--danger)", borderColor: "var(--danger)" }}>
              {deleting ? "Deleting…" : "Confirm delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
