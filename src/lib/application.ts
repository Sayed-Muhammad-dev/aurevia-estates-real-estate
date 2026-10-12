export async function applicationRequest<T = Record<string, unknown>>(
  route: string,
  data?: unknown,
): Promise<T> {
  const response = await fetch("/api/app/" + route, {
    credentials: "same-origin",
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result as T;
}
