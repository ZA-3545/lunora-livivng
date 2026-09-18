"use client";

import { FormEvent, useState } from "react";
import { homepage } from "@/lib/homepage";

export function Newsletter() {
  const { newsletter } = homepage;
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="newsletter" className="section">
      <div className="wrap">
        <div className="news">
          <div>
            <h2>{newsletter.title}</h2>
            <p>{newsletter.body}</p>
          </div>
          {submitted ? (
            <p className="news-thanks">You’re on the list. We’ll be in touch.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="newsletter-contact">
                Email or WhatsApp number
              </label>
              <input
                id="newsletter-contact"
                type="text"
                name="contact"
                placeholder={newsletter.placeholder}
                required
                autoComplete="email"
              />
              <button type="submit">{newsletter.cta}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
