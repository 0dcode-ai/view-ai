import { NextResponse } from "next/server";
import { analyzeGithubRepository } from "@/lib/github-repo-agent";
import { getGithubTrendRepository, saveGithubRepoAnalysis } from "@/lib/github-trends";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "仓库 ID 无效。" }, { status: 400 });
  }

  const current = await getGithubTrendRepository(id);
  if (!current) {
    return NextResponse.json({ error: "仓库不存在。" }, { status: 404 });
  }

  const payload = await analyzeGithubRepository(current);
  const repository = await saveGithubRepoAnalysis(id, payload.analysis);

  return NextResponse.json({
    repository,
    analysis: payload.analysis,
    execution: payload.execution,
  });
}
