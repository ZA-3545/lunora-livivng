export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & T;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? "Request failed",
      data.code,
    );
  }
  return data;
}
