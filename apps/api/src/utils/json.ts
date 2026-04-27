export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function normalizeTags(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input : String(input ?? "").split(/[,，、\n]/);
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of raw) {
    const tag = String(item).trim();
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    tags.push(tag);
  }

  return tags.slice(0, 12);
}

export function tagsToJson(input: string | string[] | null | undefined): string {
  return JSON.stringify(normalizeTags(input));
}

export function tagsFromJson(json: string | null | undefined): string[] {
  return normalizeTags(safeJsonParse<string[]>(json, []));
}
