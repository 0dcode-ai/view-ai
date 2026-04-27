import { describe, expect, it } from "vitest";
import { normalizeTags, safeJsonParse, tagsFromJson, tagsToJson } from "@/lib/tags";

describe("tag helpers", () => {
  it("splits common Chinese and English separators", () => {
    expect(normalizeTags("MySQL，索引,事务、锁\n面试")).toEqual(["MySQL", "索引", "事务", "锁", "面试"]);
  });

  it("removes duplicates and empty values", () => {
    expect(normalizeTags(["Redis", "", "Redis", " 缓存 "])).toEqual(["Redis", "缓存"]);
  });

  it("round-trips json tags safely", () => {
    const json = tagsToJson("React，前端");
    expect(tagsFromJson(json)).toEqual(["React", "前端"]);
    expect(tagsFromJson("{bad")).toEqual([]);
  });

  it("uses fallback for invalid json", () => {
    expect(safeJsonParse("{bad", { ok: true })).toEqual({ ok: true });
  });
});
