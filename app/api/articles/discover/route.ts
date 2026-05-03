import { NextResponse } from "next/server";
import type { ArticleRecommendation } from "@/app/types";

export const dynamic = "force-dynamic";

type DevToArticle = {
  id: number;
  title: string;
  url: string;
  description?: string;
  tag_list?: string[];
  published_at?: string;
};

type HnHit = {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  author?: string;
  created_at?: string;
};

const officialSources: ArticleRecommendation[] = [
  {
    id: "official-react-learn",
    title: "React 官方学习文档",
    url: "https://react.dev/learn",
    source: "React",
    summary: "从组件、状态、Effect 到性能思路，适合系统补齐 React 基础和新文档范式。",
    topic: "React",
    level: "入门",
    tags: ["React", "Frontend", "Hooks"],
    publishedAt: null,
  },
  {
    id: "official-next-docs",
    title: "Next.js 官方文档",
    url: "https://nextjs.org/docs",
    source: "Next.js",
    summary: "覆盖 App Router、Server Components、路由、缓存和部署，适合准备前端框架追问。",
    topic: "Next.js",
    level: "进阶",
    tags: ["Next.js", "React", "SSR"],
    publishedAt: null,
  },
  {
    id: "official-mdn-js",
    title: "JavaScript 指南",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    source: "MDN",
    summary: "系统学习 JS 语言机制、对象、异步和模块，适合作为八股知识底座。",
    topic: "JavaScript",
    level: "入门",
    tags: ["JavaScript", "MDN", "Language"],
    publishedAt: null,
  },
  {
    id: "official-web-performance",
    title: "Web Performance",
    url: "https://web.dev/learn/performance",
    source: "web.dev",
    summary: "围绕 Core Web Vitals、加载性能、运行时性能建立可落地的性能优化体系。",
    topic: "性能优化",
    level: "进阶",
    tags: ["Performance", "Frontend", "Core Web Vitals"],
    publishedAt: null,
  },
  {
    id: "official-node-guides",
    title: "Node.js Guides",
    url: "https://nodejs.org/en/learn",
    source: "Node.js",
    summary: "学习 Node.js 运行时、异步模型、包管理和服务端基础，适合后端/全栈方向。",
    topic: "Node.js",
    level: "入门",
    tags: ["Node.js", "Backend", "Runtime"],
    publishedAt: null,
  },
  {
    id: "official-redis-docs",
    title: "Redis 官方文档",
    url: "https://redis.io/docs/latest/",
    source: "Redis",
    summary: "覆盖数据结构、缓存模式、持久化和部署，适合准备缓存与高并发场景题。",
    topic: "Redis",
    level: "进阶",
    tags: ["Redis", "Cache", "Backend"],
    publishedAt: null,
  },
  {
    id: "official-mysql-optimization",
    title: "MySQL Optimization",
    url: "https://dev.mysql.com/doc/refman/8.4/en/optimization.html",
    source: "MySQL",
    summary: "索引、查询优化、执行计划和表结构设计，适合数据库面试深挖。",
    topic: "MySQL",
    level: "深入",
    tags: ["MySQL", "Database", "Index"],
    publishedAt: null,
  },
  {
    id: "official-k8s-concepts",
    title: "Kubernetes Concepts",
    url: "https://kubernetes.io/docs/concepts/",
    source: "Kubernetes",
    summary: "理解 Pod、Deployment、Service、调度和配置，适合云原生方向学习。",
    topic: "Kubernetes",
    level: "进阶",
    tags: ["Kubernetes", "Cloud Native", "Infrastructure"],
    publishedAt: null,
  },
  {
    id: "fowler-microservices",
    title: "Microservices",
    url: "https://martinfowler.com/articles/microservices.html",
    source: "Martin Fowler",
    summary: "理解微服务拆分、组织边界、部署和复杂度权衡，适合系统设计讨论。",
    topic: "系统设计",
    level: "深入",
    tags: ["System Design", "Microservices", "Architecture"],
    publishedAt: null,
  },
];

const topicTags: Record<string, string> = {
  react: "react",
  next: "nextjs",
  "next.js": "nextjs",
  javascript: "javascript",
  typescript: "typescript",
  node: "node",
  "node.js": "node",
  redis: "redis",
  mysql: "mysql",
  docker: "docker",
  kubernetes: "kubernetes",
  k8s: "kubernetes",
  性能: "performance",
  架构: "architecture",
  系统设计: "architecture",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "React";
  const sourceMode = searchParams.get("source") || "all";
  const topic = searchParams.get("topic")?.trim() || query;

  const [devTo, hn] = await Promise.all([
    sourceMode === "official" ? Promise.resolve([]) : loadDevToArticles(query, topic),
    sourceMode === "official" ? Promise.resolve([]) : loadHackerNewsArticles(query, topic),
  ]);

  const official = officialSources
    .filter((article) => matchesTopic(article, query))
    .slice(0, 8);

  const articles = dedupeArticles([
    ...(sourceMode === "community" ? [] : official),
    ...devTo,
    ...hn,
    ...(official.length ? [] : officialSources.slice(0, 5)),
  ]).slice(0, 18);

  return NextResponse.json({
    query,
    sourceMode,
    articles,
  });
}

async function loadDevToArticles(query: string, topic: string): Promise<ArticleRecommendation[]> {
  const tag = topicTags[query.toLowerCase()] ?? topicTags[topic.toLowerCase()] ?? encodeURIComponent(query.toLowerCase().replace(/\s+/g, ""));

  try {
    const response = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=8&top=7`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const articles = (await response.json()) as DevToArticle[];
    return articles.map((article) => ({
      id: `devto-${article.id}`,
      title: article.title,
      url: article.url,
      source: "DEV Community",
      summary: article.description || `围绕 ${topic} 的社区文章，可用于扩展案例和实践视角。`,
      topic,
      level: inferLevel(`${article.title} ${article.description ?? ""}`),
      tags: (article.tag_list ?? []).slice(0, 5),
      publishedAt: article.published_at ?? null,
    }));
  } catch {
    return [];
  }
}

async function loadHackerNewsArticles(query: string, topic: string): Promise<ArticleRecommendation[]> {
  try {
    const params = new URLSearchParams({ query, tags: "story", hitsPerPage: "8" });
    const response = await fetch(`https://hn.algolia.com/api/v1/search?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { hits?: HnHit[] };
    return (payload.hits ?? [])
      .filter((hit) => hit.url || hit.story_url)
      .map((hit) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title || hit.story_title || query,
        url: hit.url || hit.story_url || "https://news.ycombinator.com/",
        source: "Hacker News",
        summary: `社区讨论热度文章，适合了解 ${topic} 的工程实践、争议和真实案例。`,
        topic,
        level: inferLevel(`${hit.title ?? ""} ${hit.story_title ?? ""}`),
        tags: [topic, "Community"].filter(Boolean),
        publishedAt: hit.created_at ?? null,
      }));
  } catch {
    return [];
  }
}

function matchesTopic(article: ArticleRecommendation, query: string) {
  const text = `${article.title} ${article.summary} ${article.topic} ${article.tags.join(" ")}`.toLowerCase();
  const words = query.toLowerCase().split(/\s+|,|，/).filter(Boolean);
  return words.length === 0 || words.some((word) => text.includes(word)) || text.includes(query.toLowerCase());
}

function inferLevel(text: string): ArticleRecommendation["level"] {
  const lower = text.toLowerCase();
  if (/deep|internals|architecture|advanced|performance|scaling|深入|原理|架构|优化/.test(lower)) return "深入";
  if (/guide|intro|learn|入门|基础|getting started/.test(lower)) return "入门";
  return "进阶";
}

function dedupeArticles(articles: ArticleRecommendation[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.url.replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
