import { handle } from "./backend.mjs";
export async function published(kind) {
  const response = await handle(
    new Request("http://application.local/api/app/public"),
  );
  if (!response.ok) throw new Error("Published content is unavailable");
  const data = await response.json();
  return data.collections[kind] || [];
}
