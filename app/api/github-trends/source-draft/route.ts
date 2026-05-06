import { NextResponse } from "next/server";
import { fallbackGithubRadarDigest } from "@/lib/github-radar-agent";
import { listGithubTrends } from "@/lib/github-trends";

export const dynamic = "force-dynamic";

type Body = {
  type?: "radar" | "repo";
  repoId?: number;
  q?: string;
  topic?: string;
  language?: string;
  window?: string;
  sort?: string;
  favorite?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;

  try {
    const trends = await listGithubTrends({
      q: typeof body.q === "string" ? body.q : undefined,
      topic: typeof body.topic === "string" ? body.topic : undefined,
      language: typeof body.language === "string" ? body.language : undefined,
      window: typeof body.window === "string" ? body.window : undefined,
      sort: typeof body.sort === "string" ? body.sort : undefined,
      favorite: typeof body.favorite === "string" ? body.favorite : undefined,
    });

    if (body.type === "repo" && typeof body.repoId === "number") {
      const repo = trends.repositories.find((item) => item.id === body.repoId);
      if (!repo) {
        return NextResponse.json({ error: "仓库不存在。" }, { status: 404 });
      }

      const title = `${repo.fullName} 研究摘要`;
      const lines = [
        `仓库：${repo.fullName}`,
        `Score：${repo.score}，Rank：${repo.rank}`,
        `语言：${repo.language || "未知"}`,
        `Stars：${repo.stars}，24h +${repo.starDelta24h}，7d +${repo.starDelta7d}`,
        repo.description ? `简介：${repo.description}` : "",
        repo.topics.length ? `Topics：${repo.topics.join("、")}` : "",
        repo.analysis?.summary ? `AI 总结：${repo.analysis.summary}` : "",
        repo.analysis?.whyTrending?.length ? `为什么值得关注：${repo.analysis.whyTrending.join("；")}` : "",
        repo.analysis?.learningValue?.length ? `学习价值：${repo.analysis.learningValue.join("；")}` : "",
        repo.analysis?.riskSignals?.length ? `风险信号：${repo.analysis.riskSignals.join("；")}` : "",
        `GitHub：${repo.htmlUrl}`,
      ].filter(Boolean);

      return NextResponse.json({
        sourceDraft: {
          title,
          sourceType: "github",
          content: lines.join("\n"),
          metadata: {
            kind: "github-repo",
            repoId: repo.id,
            githubId: repo.githubId,
            rank: repo.rank,
            score: repo.score,
            htmlUrl: repo.htmlUrl,
          },
        },
      });
    }

    const digest = fallbackGithubRadarDigest(trends.radar, trends.repositories, {
      q: typeof body.q === "string" ? body.q : undefined,
      topic: typeof body.topic === "string" ? body.topic : undefined,
      language: typeof body.language === "string" ? body.language : undefined,
      window: typeof body.window === "string" ? body.window : undefined,
      sort: typeof body.sort === "string" ? body.sort : undefined,
      favorite: typeof body.favorite === "string" ? body.favorite : undefined,
    });

    const lines = [
      digest.title,
      "",
      digest.summary,
      "",
      digest.themeTakeaways.length ? `主题判断：${digest.themeTakeaways.join("；")}` : "",
      digest.opportunities.length ? `机会点：${digest.opportunities.join("；")}` : "",
      digest.risks.length ? `风险：${digest.risks.join("；")}` : "",
      digest.recommendedActions.length ? `建议动作：${digest.recommendedActions.join("；")}` : "",
      digest.watchItems.length
        ? `重点仓库：${digest.watchItems.map((item) => `${item.repoFullName}（${item.action}，${item.reason}）`).join("；")}`
        : "",
    ].filter(Boolean);

    return NextResponse.json({
      sourceDraft: {
        title: digest.title,
        sourceType: "github",
        content: lines.join("\n"),
        metadata: {
          kind: "github-radar",
          snapshotDate: trends.meta.snapshotDate,
          total: trends.meta.total,
          filters: {
            q: body.q || null,
            topic: body.topic || null,
            language: body.language || null,
            window: body.window || null,
            sort: body.sort || null,
            favorite: body.favorite || null,
          },
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成 GitHub 来源草稿失败。" },
      { status: 502 },
    );
  }
}
