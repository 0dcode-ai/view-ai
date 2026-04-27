export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "请求失败");
  }

  return payload as T;
}

export function joinTags(tags: string[]) {
  return tags.filter(Boolean).join("，");
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("zh-CN");
}

export function scoreOrDash(value: number | undefined) {
  return typeof value === "number" ? value : "-";
}
