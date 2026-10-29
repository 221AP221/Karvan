export async function callAi<T>(task: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/ai/${task}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "AI xətası");
  return data as T;
}
