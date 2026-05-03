"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Code2, Heading2, ImagePlus, Italic, LinkIcon, List, ListOrdered, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const toolBtn = "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50";

interface ArticleEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}

export function ArticleEditor({ value, onChange, onUploadImage }: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "my-3 max-h-[420px] rounded-xl border border-border object-contain",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Placeholder.configure({
        placeholder: "粘贴技术文章、代码片段、图片截图，像知识库一样沉淀下来。",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] rounded-b-xl border-x border-b border-border bg-surface px-4 py-3 text-sm leading-relaxed outline-none prose-pre:rounded-lg prose-pre:bg-slate-950 prose-pre:p-3 prose-pre:text-slate-50",
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        void Promise.all(files.map((file) => insertImage(file).catch(() => undefined)));
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (!files.length) return false;
        event.preventDefault();
        void Promise.all(files.map((file) => insertImage(file).catch(() => undefined)));
        return true;
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML(), currentEditor.getText());
    },
  });

  useEffect(() => {
    if (!editor || value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  async function insertImage(file: File) {
    const url = await onUploadImage(file);
    editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("输入链接地址", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  if (!editor) {
    return <div className="min-h-[420px] rounded-xl border border-border bg-slate-50" />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-border bg-slate-50 p-2">
        <button className={cn(toolBtn, editor.isActive("bold") && "border-primary text-primary")} type="button" title="加粗" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("italic") && "border-primary text-primary")} type="button" title="斜体" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("heading", { level: 2 }) && "border-primary text-primary")} type="button" title="标题" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("bulletList") && "border-primary text-primary")} type="button" title="无序列表" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("orderedList") && "border-primary text-primary")} type="button" title="有序列表" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("blockquote") && "border-primary text-primary")} type="button" title="引用" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("codeBlock") && "border-primary text-primary")} type="button" title="代码块" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={15} />
        </button>
        <button className={cn(toolBtn, editor.isActive("link") && "border-primary text-primary")} type="button" title="链接" onClick={setLink}>
          <LinkIcon size={15} />
        </button>
        <button className={toolBtn} type="button" title="插入图片" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus size={15} />
        </button>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void insertImage(file).catch(() => undefined);
            event.currentTarget.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
