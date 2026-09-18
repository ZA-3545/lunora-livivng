"use client";

export function AdminListFilter({
  query,
  onQuery,
  category,
  onCategory,
  categories,
  placeholder,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  category?: string;
  onCategory?: (value: string) => void;
  categories?: Array<{ id: string; name: string }>;
}) {
  return (
    <form className="admin-filter" onSubmit={(event) => event.preventDefault()}>
      <label>
        Search
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {categories && onCategory ? (
        <label>
          Category
          <select
            value={category ?? ""}
            onChange={(event) => onCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </form>
  );
}
