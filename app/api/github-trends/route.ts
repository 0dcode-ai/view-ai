import { NextResponse } from "next/server";
import { listGithubTrends } from "@/lib/github-trends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const payload = await listGithubTrends({
      q: url.searchParams.get("q") || undefined,
      topic: url.searchParams.get("topic") || undefined,
      language: url.searchParams.get("language") || undefined,
      window: url.searchParams.get("window") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      favorite: url.searchParams.get("favorite") || undefined,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取 GitHub 趋势失败。" },
      { status: 500 },
    );
  }
}
