import { describe, expect, it } from "vitest";
import { normalizeTags, safeJsonParse, tagsFromJson, tagsToJson } from "./json";

describe("json/tag utilities", () => {
  it("normalizes tag strings and removes duplicates", () => {
    expect(normalizeTags("MySQL，Redis, MySQL\n网络")).toEqual(["MySQL", "Redis", "网络"]);
  });

  it("round trips tags JSON and tolerates malformed JSON", () => {
    expect(tagsFromJson(tagsToJson(["a", "b"]))).toEqual(["a", "b"]);
    expect(safeJsonParse("{", { ok: true })).toEqual({ ok: true });
  });
});
