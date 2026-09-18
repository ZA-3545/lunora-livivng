"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not sign in.");
      setPending(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-login">
      <form className="admin-form" onSubmit={onSubmit}>
        <h1>Admin sign in</h1>
        <label>
          Password
          <input name="password" type="password" required autoFocus />
        </label>
        {error ? <p className="admin-error">{error}</p> : null}
        <button className="admin-btn" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
