import { NextResponse } from "next/server";
import { analyzeGithubRadar } from "@/lib/github-radar-agent";
import { listGithubTrends } from "@/lib/github-trends";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const trends = await listGithubTrends({
      q: typeof body.q === "string" ? body.q : undefined,
      topic: typeof body.topic === "string" ? body.topic : undefined,
      language: typeof body.language === "string" ? body.language : undefined,
      window: typeof body.window === "string" ? body.window : undefined,
      sort: typeof body.sort === "string" ? body.sort : undefined,
      favorite: typeof body.favorite === "string" ? body.favorite : undefined,
    });

    const payload = await analyzeGithubRadar({
      radar: trends.radar,
      repositories: trends.repositories,
      filters: {
        q: typeof body.q === "string" ? body.q : undefined,
        topic: typeof body.topic === "string" ? body.topic : undefined,
        language: typeof body.language === "string" ? body.language : undefined,
        window: typeof body.window === "string" ? body.window : undefined,
        sort: typeof body.sort === "string" ? body.sort : undefined,
        favorite: typeof body.favorite === "string" ? body.favorite : undefined,
      },
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成 GitHub 雷达简报失败。" },
      { status: 502 },
    );
  }
}
