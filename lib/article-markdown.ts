function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function renderInlineMarkdown(text: string) {
  let rendered = escapeHtml(text);
  rendered = rendered.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => `<img src="${url}" alt="${alt}" />`);
  rendered = rendered.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => `<a href="${url}">${label}</a>`);
  rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  rendered = rendered.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
  return rendered;
}

function blockToParagraph(lines: string[]) {
  return `<p>${renderInlineMarkdown(lines.join(" "))}</p>`;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```([\w-]+)?$/);
    if (fence) {
      const language = fence[1] ?? "";
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      const className = language ? ` class="language-${escapeHtml(language)}"` : "";
      blocks.push(`<pre><code${className}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(`<blockquote><p>${quoteLines.map(renderInlineMarkdown).join("<br />")}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(`<ol>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (
        !current ||
        /^```/.test(current) ||
        /^(#{1,3})\s+/.test(current) ||
        current.startsWith(">") ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current)
      ) {
        break;
      }
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(blockToParagraph(paragraphLines));
  }

  return blocks.join("\n");
}

function inlineHtmlToMarkdown(value: string) {
  return value
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<code>([\s\S]*?)<\/code>/gi, (_match, content) => `\`${decodeHtml(content)}\``)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<img [^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)")
    .replace(/<img [^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*>/gi, "![$1]($2)")
    .replace(/<br\s*\/?>/gi, "\n");
}

export function htmlToMarkdown(html: string) {
  let markdown = html;

  markdown = markdown.replace(/<pre><code(?: class="[^"]+")?>([\s\S]*?)<\/code><\/pre>/gi, (_match, code) => `\n\`\`\`\n${decodeHtml(code).trim()}\n\`\`\`\n`);
  markdown = markdown.replace(/<h1>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  markdown = markdown.replace(/<h2>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  markdown = markdown.replace(/<h3>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  markdown = markdown.replace(/<blockquote><p>([\s\S]*?)<\/p><\/blockquote>/gi, (_match, content) => {
    const quote = inlineHtmlToMarkdown(content)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    return `\n${quote}\n`;
  });
  markdown = markdown.replace(/<ul>([\s\S]*?)<\/ul>/gi, (_match, content) => {
    const items = [...content.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((item) => `- ${inlineHtmlToMarkdown(item[1]).trim()}`);
    return `\n${items.join("\n")}\n`;
  });
  markdown = markdown.replace(/<ol>([\s\S]*?)<\/ol>/gi, (_match, content) => {
    const items = [...content.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((item, index) => `${index + 1}. ${inlineHtmlToMarkdown(item[1]).trim()}`);
    return `\n${items.join("\n")}\n`;
  });
  markdown = markdown.replace(/<p>([\s\S]*?)<\/p>/gi, (_match, content) => `\n${inlineHtmlToMarkdown(content).trim()}\n`);

  markdown = inlineHtmlToMarkdown(markdown);
  markdown = decodeHtml(markdown)
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return markdown;
}

export function markdownToText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\d+\.\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
