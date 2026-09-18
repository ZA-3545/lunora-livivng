import Link from "next/link";
import { homepage } from "@/lib/homepage";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer id="footer" className="site-footer">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <Link href="/" className="logo">
            {site.name}
          </Link>
          <p>{homepage.footer.blurb}</p>
          <p className="photo-source">
            Lifestyle photos provided by{" "}
            <a href="https://www.pexels.com" target="_blank" rel="noreferrer">
              Pexels
            </a>
            . Product photos are placeholders until supplier shots arrive.
          </p>
        </div>
        {homepage.footer.columns.map((column) => (
          <div key={column.title}>
            <h5>{column.title}</h5>
            {column.links.map((link) => (
              <Link key={link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
