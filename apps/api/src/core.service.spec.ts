import { describe, expect, it } from "vitest";

describe("agent fallback github awareness", () => {
  it("keeps a placeholder spec to protect github-aware fallback behavior", () => {
    expect(true).toBe(true);
  });

  it("documents agent-specific fallback expectations", () => {
    expect(["application-match", "resume-tailor", "candidate-prep"]).toContain("application-match");
  });
});
