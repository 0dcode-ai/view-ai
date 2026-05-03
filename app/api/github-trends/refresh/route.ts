import { NextResponse } from "next/server";
import { refreshGithubTrends } from "@/lib/github-trends";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const payload = await refreshGithubTrends({
      q: typeof body.q === "string" ? body.q : undefined,
      topic: typeof body.topic === "string" ? body.topic : undefined,
      language: typeof body.language === "string" ? body.language : undefined,
      window: typeof body.window === "string" ? body.window : undefined,
      sort: typeof body.sort === "string" ? body.sort : undefined,
      favorite: typeof body.favorite === "string" ? body.favorite : undefined,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "刷新 GitHub 趋势失败。" },
      { status: 502 },
    );
  }
}
