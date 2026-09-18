export function isRemotePhoto(src?: string | null) {
  return Boolean(src && /^https?:\/\//.test(src));
}

export function ComingSoonMedia({
  className,
  name,
}: {
  className?: string;
  name: string;
}) {
  return (
    <div
      className={`coming-soon-media ${className ?? ""}`.trim()}
      role="img"
      aria-label={`${name} — photo coming soon`}
    >
      <span>Photo coming soon</span>
    </div>
  );
}

export function CatalogMedia({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (isRemotePhoto(src)) {
    return <img className={className} src={src ?? ""} alt={name} />;
  }
  return <ComingSoonMedia className={className} name={name} />;
}
