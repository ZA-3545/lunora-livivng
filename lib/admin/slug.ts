export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseImageInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//.test(part));
}
