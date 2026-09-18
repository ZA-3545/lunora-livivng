import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({ title, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {href && linkLabel ? <Link href={href}>{linkLabel}</Link> : null}
    </div>
  );
}
