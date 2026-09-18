"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({
  action,
  label = "Delete",
}: {
  action: string;
  label?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <>
      <button
        type="button"
        className="admin-btn-danger"
        onClick={async () => {
          if (!window.confirm("Delete this record?")) return;
          const response = await fetch(action, { method: "DELETE" });
          const result = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          if (!response.ok) {
            setError(result?.error ?? "Could not delete.");
            return;
          }
          router.refresh();
        }}
      >
        {label}
      </button>
      {error ? <p className="admin-error">{error}</p> : null}
    </>
  );
}
