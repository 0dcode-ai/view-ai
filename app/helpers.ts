export { appRequestJson as requestJson } from "@/app/api-client";

export function joinTags(tags: string[]) {
  return tags.filter(Boolean).join("，");
}

export function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export function scoreOrDash(value: number | undefined) {
  return typeof value === "number" ? value : "-";
}
