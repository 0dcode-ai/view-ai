"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Newspaper, BookOpen, Plus, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestJson,
  joinTags,
} from "@/app/helpers";
import { htmlToMarkdown, markdownToHtml } from "@/lib/technical-articles";
import { cn } from "@/lib/utils";
import type {
  ArticleRecommendation,
  ArticleSearchResponse,
  TechnicalArticle,
  TechnicalArticleListResponse,
} from "@/app/types";
import { ArticleCard } from "./article-card";
import { ArticleDetail } from "./article-detail";
import { ArticleEditorModal, type ArticleForm } from "./article-editor-modal";
import { ArticleDiscoverModal } from "./article-discover-modal";

type ArticleFormatResult = {
  title: string;
  topic: string;
  tags: string[];
  summary: string;
  contentMarkdown: string;
};

const emptyForm: ArticleForm = {
  title: "",
  topic: "",
  tags: "",
  sourceUrl: "",
  summary: "",
  contentMarkdown: "",
  contentHtml: "",
  contentText: "",
  status: "published",
};

export interface ArticlesTabRef {
  refresh: () => Promise<void>;
}

interface ArticlesTabProps {
  onToast: (msg: string) => void;
}

export const ArticlesTab = forwardRef<ArticlesTabRef, ArticlesTabProps>(
  function ArticlesTab({ onToast }, ref) {
    // State
    const [articles, setArticles] = useState<TechnicalArticle[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [filters, setFilters] = useState({ q: "", topic: "", tag: "" });
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [form, setForm] = useState<ArticleForm>(emptyForm);
    const [rawText, setRawText] = useState("");
    const [assetIds, setAssetIds] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [showDiscover, setShowDiscover] = useState(false);
    const [discoverTopic, setDiscoverTopic] = useState("React 性能优化");
    const [discoverSourceMode, setDiscoverSourceMode] = useState("all");
    const [discoverArticles, setDiscoverArticles] = useState<ArticleRecommendation[]>([]);
    const [busy, setBusy] = useState<string | null>(null);

    // Derived
    const selectedArticle = useMemo(() => {
      if (!selectedId) return articles[0] ?? null;
      return articles.find((a) => a.id === selectedId) ?? articles[0] ?? null;
    }, [selectedId, articles]);

    // Auto-select
    useEffect(() => {
      if (!selectedId && articles[0]) setSelectedId(articles[0].id);
      if (selectedId && !articles.some((a) => a.id === selectedId)) {
        setSelectedId(articles[0]?.id ?? null);
      }
    }, [selectedId, articles]);

    // Initial load
    useEffect(() => {
      void loadArticles();
    }, []);

    // Expose refresh
    useImperativeHandle(ref, () => ({ refresh: () => loadArticles(filters) }));

    // ── Handlers ──

    async function loadArticles(next = filters) {
      const params = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => { if (v) params.set(k, v); });
      const qs = params.toString();
      const payload = await requestJson<TechnicalArticleListResponse>(
        `/api/articles${qs ? `?${qs}` : ""}`,
      );
      setArticles(payload.articles);
      setTopics(payload.topics);
      setTags(payload.tags);
    }

    async function loadDiscover(topic = discoverTopic, source = discoverSourceMode) {
      if (!topic.trim()) { onToast("先输入一个技术选题。"); return; }
      setBusy("article-discover");
      try {
        const params = new URLSearchParams({ q: topic, source });
        const payload = await requestJson<ArticleSearchResponse>(`/api/articles/discover?${params}`);
        setDiscoverArticles(payload.articles);
        onToast("发现文章已更新。");
      } catch (err) {
        onToast(err instanceof Error ? err.message : "文章加载失败");
      } finally { setBusy(null); }
    }

    function openCreate(prefill?: Partial<ArticleForm>) {
      setEditingId(null);
      setAssetIds([]);
      setForm({ ...emptyForm, ...prefill });
      setRawText(prefill?.contentMarkdown || "");
      setShowEditor(true);
    }

    function openEdit(article: TechnicalArticle) {
      setEditingId(article.id);
      setAssetIds(article.assets.map((a) => a.id));
      const md = htmlToMarkdown(article.contentHtml || article.contentText || "");
      setForm({
        title: article.title,
        topic: article.topic ?? "",
        tags: joinTags(article.tags),
        sourceUrl: article.sourceUrl ?? "",
        summary: article.summary ?? "",
        contentMarkdown: md,
        contentHtml: article.contentHtml,
        contentText: article.contentText,
        status: article.status || "published",
      });
      setRawText(article.contentText || md);
      setShowEditor(true);
    }

    async function handleSave() {
      if (!form.title.trim()) { onToast("文章标题不能为空。"); return; }
      if (!form.contentMarkdown.trim()) { onToast("先整理出正文 Markdown。"); return; }
      setBusy("article-save");
      try {
        const payload = await requestJson<{ article: TechnicalArticle }>(
          editingId ? `/api/articles/${editingId}` : "/api/articles",
          {
            method: editingId ? "PATCH" : "POST",
            body: JSON.stringify({ ...form, assetIds }),
          },
        );
        setShowEditor(false);
        setEditingId(null);
        setAssetIds([]);
        setRawText("");
        await loadArticles(filters);
        setSelectedId(payload.article.id);
        onToast(editingId ? "文章已更新。" : "文章已保存。");
      } catch (err) {
        onToast(err instanceof Error ? err.message : "文章保存失败");
      } finally { setBusy(null); }
    }

    async function handleFormat() {
      if (rawText.trim().length < 20) { onToast("先粘贴一段完整一点的技术内容。"); return; }
      setBusy("article-format");
      try {
        const payload = await requestJson<{ article: ArticleFormatResult }>("/api/articles/format", {
          method: "POST",
          body: JSON.stringify({ rawText, sourceUrl: form.sourceUrl, topicHint: form.topic }),
        });
        setForm((cur) => ({
          ...cur,
          title: payload.article.title || cur.title,
          topic: payload.article.topic || cur.topic,
          tags: payload.article.tags.length ? joinTags(payload.article.tags) : cur.tags,
          summary: payload.article.summary || cur.summary,
          contentMarkdown: payload.article.contentMarkdown,
          contentHtml: markdownToHtml(payload.article.contentMarkdown),
          contentText: payload.article.contentMarkdown,
        }));
        onToast("已整理成 Markdown 草稿。");
      } catch (err) {
        onToast(err instanceof Error ? err.message : "AI 整理失败");
      } finally { setBusy(null); }
    }

    async function handleUploadImage(file: File) {
      setBusy("article-upload");
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (editingId) {
          formData.append("articleId", String(editingId));
        }

        const response = await fetch("/api/articles/assets", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json().catch(() => ({}))) as { error?: string; asset?: { id: number; url: string } };
        if (!response.ok || !payload.asset) {
          throw new Error(payload.error || "图片上传失败");
        }
        return payload.asset;
      } finally {
        setBusy(null);
      }
    }

    async function handleDelete(articleId: number) {
      if (!window.confirm("确认删除这篇技术文章吗？")) return;
      setBusy("article-delete");
      try {
        await requestJson(`/api/articles/${articleId}`, { method: "DELETE" });
        setSelectedId(null);
        await loadArticles(filters);
        onToast("文章已删除。");
      } catch (err) {
        onToast(err instanceof Error ? err.message : "文章删除失败");
      } finally { setBusy(null); }
    }

    async function handleSaveDiscovered(article: ArticleRecommendation) {
      setBusy(`discover-save-${article.id}`);
      try {
        const payload = await requestJson<{ article: TechnicalArticle }>("/api/articles", {
          method: "POST",
          body: JSON.stringify({
            title: article.title,
            topic: article.topic || discoverTopic,
            tags: article.tags,
            sourceUrl: article.url,
            summary: article.summary,
            contentHtml: `<p>${article.summary}</p><p><a href="${article.url}">${article.url}</a></p>`,
            contentText: `${article.summary} ${article.url}`,
            status: "draft",
          }),
        });
        await loadArticles(filters);
        setSelectedId(payload.article.id);
        setShowDiscover(false);
        onToast("已保存为本地文章草稿。");
      } catch (err) {
        onToast(err instanceof Error ? err.message : "保存推荐文章失败");
      } finally { setBusy(null); }
    }

    // ── Render ──

    return (
      <div className="grid gap-4">
        {/* Filter bar */}
        <div className="rounded-2xl bg-card ring-1 ring-foreground/5 shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Newspaper className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">技术文章库</h3>
          </div>
          <div className="grid gap-3.5 p-4">
            {/* Search row */}
            <div className="grid gap-3 xl:grid-cols-[minmax(320px,1.5fr)_180px_auto_auto] xl:items-center">
              <Input
                className="w-full"
                placeholder="搜索标题、正文、摘要或标签"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && void loadArticles(filters)}
              />
              <select
                className="flex h-8 min-w-[180px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={filters.tag}
                onChange={(e) => {
                  const next = { ...filters, tag: e.target.value };
                  setFilters(next);
                  void loadArticles(next);
                }}
              >
                <option value="">全部标签</option>
                {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
              <Button className="xl:justify-center" variant="outline" size="sm" onClick={() => void loadArticles(filters)}>
                <Search className="size-3.5" /> 搜索
              </Button>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDiscover(true); void loadDiscover(); }}
                >
                  <Sparkles className="size-3.5" /> 发现文章
                </Button>
                <Button size="sm" onClick={() => openCreate()}>
                  <Plus className="size-3.5" /> 新建文章
                </Button>
              </div>
            </div>

            {/* Topic pills */}
            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                  !filters.topic
                    ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                )}
                type="button"
                onClick={() => {
                  const next = { ...filters, topic: "" };
                  setFilters(next);
                  void loadArticles(next);
                }}
              >
                全部
              </button>
              {topics.map((topic) => (
                <button
                  key={topic}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                    filters.topic === topic
                      ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20",
                  )}
                  type="button"
                  onClick={() => {
                    const next = { ...filters, topic };
                    setFilters(next);
                    void loadArticles(next);
                  }}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Master-detail */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(380px,560px)_1fr]">
          {/* List */}
          <div className="rounded-2xl bg-card ring-1 ring-foreground/5 shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <BookOpen className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">文章列表</h3>
              <Badge variant="secondary" className="ml-auto text-[10px]">{articles.length} 篇</Badge>
            </div>
            <div className="p-3.5">
              {articles.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center">
                  <p className="text-sm text-muted-foreground">还没有技术文章。可以新建一篇，或者从"发现文章"保存草稿。</p>
                  <Button className="mx-auto mt-4" size="sm" onClick={() => openCreate()}>
                    <Plus className="size-3.5" /> 新建文章
                  </Button>
                </div>
              ) : (
                <div className="grid max-h-[760px] gap-3 overflow-auto pr-1">
                  {articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isSelected={selectedArticle?.id === article.id}
                      onClick={() => setSelectedId(article.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail */}
          <div className="rounded-2xl bg-card ring-1 ring-foreground/5 shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Newspaper className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">文章详情</h3>
            </div>
            <div className="p-4">
              <ArticleDetail
                article={selectedArticle}
                onEdit={openEdit}
                onDelete={(id) => void handleDelete(id)}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <ArticleEditorModal
          open={showEditor}
          isEditing={editingId !== null}
          form={form}
          rawText={rawText}
          busy={busy}
          onUploadImage={handleUploadImage}
          onAssetLinked={(assetId) => setAssetIds((prev) => Array.from(new Set([...prev, assetId])))}
          onFormChange={setForm}
          onRawTextChange={setRawText}
          onFormat={() => void handleFormat()}
          onSave={() => void handleSave()}
          onClose={() => setShowEditor(false)}
        />

        <ArticleDiscoverModal
          open={showDiscover}
          topic={discoverTopic}
          sourceMode={discoverSourceMode}
          articles={discoverArticles}
          busy={busy}
          onTopicChange={setDiscoverTopic}
          onSourceModeChange={setDiscoverSourceMode}
          onSearch={() => void loadDiscover()}
          onSave={(a) => void handleSaveDiscovered(a)}
          onClose={() => setShowDiscover(false)}
        />
      </div>
    );
  },
);
