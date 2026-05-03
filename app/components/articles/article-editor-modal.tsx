"use client";

import { useRef, type ClipboardEvent, type DragEvent } from "react";
import { ImagePlus, Save, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { markdownToHtml } from "@/lib/technical-articles";

export type ArticleForm = {
  title: string;
  topic: string;
  tags: string;
  sourceUrl: string;
  summary: string;
  contentMarkdown: string;
  contentHtml: string;
  contentText: string;
  status: string;
};

const previewStyles =
  "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:text-[13px] [&_code]:font-mono " +
  "[&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-bold " +
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 " +
  "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold " +
  "[&_img]:my-3 [&_img]:max-h-[380px] [&_img]:rounded-xl [&_img]:border [&_img]:border-border " +
  "[&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc " +
  "[&_p]:my-2 [&_p]:leading-7 " +
  "[&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-slate-50 [&_pre]:text-[13px] [&_pre]:leading-6";

interface ArticleEditorModalProps {
  open: boolean;
  isEditing: boolean;
  form: ArticleForm;
  rawText: string;
  busy: string | null;
  onUploadImage: (file: File) => Promise<{ id: number; url: string }>;
  onAssetLinked: (assetId: number) => void;
  onFormChange: (updater: (prev: ArticleForm) => ArticleForm) => void;
  onRawTextChange: (value: string) => void;
  onFormat: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function ArticleEditorModal({
  open,
  isEditing,
  form,
  rawText,
  busy,
  onUploadImage,
  onAssetLinked,
  onFormChange,
  onRawTextChange,
  onFormat,
  onSave,
  onClose,
}: ArticleEditorModalProps) {
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const updateField = (field: keyof ArticleForm, value: string) => {
    onFormChange((prev) => ({ ...prev, [field]: value }));
  };

  const handleMarkdownChange = (value: string) => {
    onFormChange((prev) => ({
      ...prev,
      contentMarkdown: value,
      contentHtml: markdownToHtml(value),
      contentText: value,
    }));
  };

  const insertIntoMarkdown = (snippet: string) => {
    const textarea = markdownRef.current;
    const currentValue = form.contentMarkdown;
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const nextMarkdown = `${currentValue.slice(0, start)}${snippet}${currentValue.slice(end)}`;
    handleMarkdownChange(nextMarkdown);

    requestAnimationFrame(() => {
      const el = markdownRef.current;
      if (!el) return;
      const nextPos = start + snippet.length;
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    });
  };

  const uploadImage = async (file: File) => {
    const asset = await onUploadImage(file);
    onAssetLinked(asset.id);
    const safeAlt = file.name.replace(/\.[^.]+$/, "") || "image";
    insertIntoMarkdown(`\n![${safeAlt}](${asset.url})\n`);
  };

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadImage(file);
    }
  };

  const handleFileInput = (files: FileList | null) => {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    void uploadFiles(images).catch(() => undefined);
  };

  const handlePasteOrDrop = (files: FileList | undefined | null, event: ClipboardEvent<HTMLTextAreaElement> | DragEvent<HTMLTextAreaElement>) => {
    const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return false;
    event.preventDefault();
    void uploadFiles(images).catch(() => undefined);
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
          <div>
            <h3 className="text-base font-semibold">{isEditing ? "编辑技术文章" : "新建技术文章"}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">粘贴原文 → AI 整理 → 微调 → 保存</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="grid gap-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold">原始内容</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    把技术文章、笔记或群聊摘录整段贴进来，图片可以直接粘贴、拖进来，或者点上传
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => uploadRef.current?.click()} disabled={busy === "article-upload"}>
                    <ImagePlus className="size-3.5" /> 上传图片
                  </Button>
                  <Button onClick={onFormat} disabled={busy === "article-format" || rawText.trim().length < 20}>
                    <Sparkles className="size-3.5" /> AI 整理成 Markdown
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <Textarea
                  className="min-h-[200px] font-mono text-[13px]"
                  placeholder="把原始技术内容整段贴进来，然后点右上角的 AI 整理。"
                  value={rawText}
                  onChange={(e) => onRawTextChange(e.target.value)}
                  onPaste={(e) => handlePasteOrDrop(e.clipboardData.files, e)}
                  onDrop={(e) => handlePasteOrDrop(e.dataTransfer.files, e)}
                />
                <div className="grid gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">来源 URL</label>
                    <Input placeholder="可选" value={form.sourceUrl} onChange={(e) => updateField("sourceUrl", e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">主题提示</label>
                    <Input placeholder="如 React / Redis" value={form.topic} onChange={(e) => updateField("topic", e.target.value)} />
                  </div>
                  <div className="rounded-lg border border-dashed bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
                    AI 会自动补标题、摘要、标签，并整理成标准 Markdown 草稿。
                  </div>
                </div>
              </div>

              <input
                ref={uploadRef}
                className="hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={(event) => {
                  handleFileInput(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">标题</label>
                    <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">主题页签</label>
                    <Input placeholder="如 React / Redis" value={form.topic} onChange={(e) => updateField("topic", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">标签</label>
                    <Input placeholder="逗号分隔" value={form.tags} onChange={(e) => updateField("tags", e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">状态</label>
                    <select
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                    >
                      <option value="published">published</option>
                      <option value="draft">draft</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">摘要</label>
                  <Textarea className="min-h-[80px]" value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Markdown 正文</label>
                  <Textarea
                    ref={markdownRef}
                    className="min-h-[480px] font-mono text-[13px] leading-6"
                    placeholder="# 标题&#10;&#10;## 摘要&#10;..."
                    value={form.contentMarkdown}
                    onChange={(e) => handleMarkdownChange(e.target.value)}
                    onPaste={(e) => handlePasteOrDrop(e.clipboardData.files, e)}
                    onDrop={(e) => handlePasteOrDrop(e.dataTransfer.files, e)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold">实时预览</h4>
                    <Badge>Markdown</Badge>
                  </div>
                  <div
                    className={`rounded-xl bg-card p-4 text-sm leading-7 text-foreground/90 ${previewStyles}`}
                    dangerouslySetInnerHTML={{
                      __html: form.contentMarkdown.trim()
                        ? markdownToHtml(form.contentMarkdown)
                        : "<p class='text-muted-foreground'>AI 整理后会在这里预览。</p>",
                    }}
                  />
                </div>
                <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
                  推荐流程：先粘贴原文 → 点 AI 整理 → 检查标题、摘要、标签 → 微调 Markdown → 保存。
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <Badge variant={form.contentMarkdown.trim() ? "default" : "secondary"}>
            {form.contentMarkdown.trim() ? "已生成 Markdown 草稿" : "等待整理"}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={onSave} disabled={busy === "article-save"}>
              <Save className="size-3.5" /> 保存文章
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
