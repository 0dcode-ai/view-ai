export type KnowledgeStudyGuide = {
  headline: string;
  coreAnswer: string;
  interviewAnswer: string;
  problemContext: string[];
  thinkingPath: string[];
  keySteps: string[];
  exampleOrCode: string;
  tradeoffs: string[];
  pitfalls: string[];
  followUps: string[];
  projectHooks: string[];
  reviewChecklist: string[];
};

export type KnowledgeStudyGuideInput = {
  question: string;
  answer: string;
  note?: string | null;
  topicName?: string | null;
  tags?: string[];
};

type GuideKey = keyof KnowledgeStudyGuide;

const headingToKey: Array<{ key: GuideKey; patterns: RegExp[] }> = [
  { key: "headline", patterns: [/^(标题|学习标题|考点)$/] },
  { key: "coreAnswer", patterns: [/^(一句话结论|核心结论|结论|先说结论)$/] },
  { key: "interviewAnswer", patterns: [/^(面试回答|口语回答|标准回答|参考答案)$/] },
  { key: "problemContext", patterns: [/^(问题背景|题目背景|考点定位|适用场景|为什么问)$/] },
  { key: "thinkingPath", patterns: [/^(思路|解题思路|原理拆解|理解模型|核心原理)$/] },
  { key: "keySteps", patterns: [/^(步骤|实现步骤|执行步骤|回答步骤|处理流程)$/] },
  { key: "exampleOrCode", patterns: [/^(代码|示例|代码示例|场景示例|伪代码|案例)$/] },
  { key: "tradeoffs", patterns: [/^(复杂度|复杂度与取舍|取舍|优缺点|性能与边界)$/] },
  { key: "pitfalls", patterns: [/^(易错点|常见坑|边界条件|风险点)$/] },
  { key: "followUps", patterns: [/^(常见追问|追问|延伸问题|面试追问)$/] },
  { key: "projectHooks", patterns: [/^(项目连接|项目落地|项目场景|工程落地)$/] },
  { key: "reviewChecklist", patterns: [/^(复习清单|自测清单|回顾清单|背诵检查)$/] },
];

function emptyGuide(input?: Partial<KnowledgeStudyGuideInput>): KnowledgeStudyGuide {
  const question = input?.question?.trim() || "未命名知识点";
  const answer = input?.answer?.trim() || "";
  const firstAnswerParagraph = answer.split(/\n{2,}/).map((item) => item.trim()).find(Boolean) || answer;

  return {
    headline: question,
    coreAnswer: firstAnswerParagraph || "先补齐一句话结论。",
    interviewAnswer: answer || "待补充面试口语回答。",
    problemContext: [],
    thinkingPath: [],
    keySteps: [],
    exampleOrCode: "",
    tradeoffs: [],
    pitfalls: [],
    followUps: [],
    projectHooks: [],
    reviewChecklist: [],
  };
}

function normalizeHeading(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/[：:]\s*$/, "")
    .trim();
}

function resolveGuideKey(heading: string): GuideKey | null {
  const normalized = normalizeHeading(heading);
  return headingToKey.find((item) => item.patterns.some((pattern) => pattern.test(normalized)))?.key ?? null;
}

function stripBullet(line: string) {
  return line.replace(/^\s*(?:[-*•]|[0-9]+[.)、]|[一二三四五六七八九十]+[、.])\s*/, "").trim();
}

function toList(value: string) {
  return value
    .split(/\n+/)
    .map(stripBullet)
    .filter(Boolean);
}

function toParagraph(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function setGuideValue(guide: KnowledgeStudyGuide, key: GuideKey, rawValue: string) {
  const value = rawValue.trim();
  if (!value) return;

  if (key === "headline" || key === "coreAnswer" || key === "interviewAnswer" || key === "exampleOrCode") {
    guide[key] = toParagraph(value);
    return;
  }

  guide[key] = toList(value);
}

function parseMarkdownGuide(note: string | null | undefined, base: KnowledgeStudyGuide) {
  if (!note?.trim()) {
    return base;
  }

  const lines = note.split(/\r?\n/);
  let currentKey: GuideKey | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey) {
      setGuideValue(base, currentKey, buffer.join("\n"));
    }
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^\s*#{1,4}\s+(.+?)\s*$/);
    const colonHeadingMatch = !headingMatch ? line.match(/^\s*([^：:]{2,12})[：:]\s*(.*)$/) : null;
    const nextKey = headingMatch
      ? resolveGuideKey(headingMatch[1])
      : colonHeadingMatch
        ? resolveGuideKey(colonHeadingMatch[1])
        : null;

    if (nextKey) {
      flush();
      currentKey = nextKey;
      if (colonHeadingMatch?.[2]) {
        buffer.push(colonHeadingMatch[2]);
      }
      continue;
    }

    if (currentKey) {
      buffer.push(line);
    }
  }

  flush();
  return base;
}

function parseLegacyInterviewHints(note: string | null | undefined, guide: KnowledgeStudyGuide) {
  if (!note?.trim()) {
    return guide;
  }

  const sections = [
    { key: "thinkingPath" as const, pattern: /必说点[：:]\s*([\s\S]*?)(?=\n\s*(?:常见追问|项目连接|原始摘录)[：:]|$)/ },
    { key: "followUps" as const, pattern: /常见追问[：:]\s*([\s\S]*?)(?=\n\s*(?:必说点|项目连接|原始摘录)[：:]|$)/ },
    { key: "projectHooks" as const, pattern: /项目连接[：:]\s*([\s\S]*?)(?=\n\s*(?:必说点|常见追问|原始摘录)[：:]|$)/ },
    { key: "problemContext" as const, pattern: /原始摘录[：:]\s*([\s\S]*?)$/ },
  ];

  for (const section of sections) {
    const match = note.match(section.pattern);
    if (match?.[1]) {
      setGuideValue(guide, section.key, match[1]);
    }
  }

  return guide;
}

function ensureFallbackSections(guide: KnowledgeStudyGuide, input: KnowledgeStudyGuideInput) {
  const topic = input.topicName?.trim() || input.tags?.[0] || "这个知识点";

  if (guide.problemContext.length === 0) {
    guide.problemContext = [`面试官通常想确认你是否理解 ${topic} 的使用场景、核心机制和边界。`];
  }

  if (guide.thinkingPath.length === 0) {
    guide.thinkingPath = ["先给结论，再讲原理，随后补充场景、取舍和项目例子。"];
  }

  if (guide.keySteps.length === 0) {
    guide.keySteps = ["定义问题", "解释关键机制", "说明使用场景", "补充风险和优化", "连接真实项目"];
  }

  if (!guide.exampleOrCode) {
    guide.exampleOrCode = "可以准备一个你在项目里真实用过、排查过或优化过的例子。";
  }

  if (guide.tradeoffs.length === 0) {
    guide.tradeoffs = ["说明它解决了什么问题，也要说清楚成本、限制或替代方案。"];
  }

  if (guide.pitfalls.length === 0) {
    guide.pitfalls = ["不要只背概念，至少补一个边界条件、一个常见误区或一个线上风险。"];
  }

  if (guide.followUps.length === 0) {
    guide.followUps = ["为什么这样设计？", "和替代方案相比有什么取舍？", "项目里怎么验证效果？"];
  }

  if (guide.projectHooks.length === 0) {
    guide.projectHooks = [`准备一个和 ${topic} 相关的项目场景，补充背景、动作和结果。`];
  }

  if (guide.reviewChecklist.length === 0) {
    guide.reviewChecklist = ["能 30 秒说出结论", "能解释一个核心原理", "能回答一个追问", "能连到项目经历"];
  }

  return guide;
}

export function buildKnowledgeStudyGuide(input: KnowledgeStudyGuideInput): KnowledgeStudyGuide {
  const base = emptyGuide(input);
  const markdownParsed = parseMarkdownGuide(input.note, base);
  const legacyParsed = parseLegacyInterviewHints(input.note, markdownParsed);
  return ensureFallbackSections(legacyParsed, input);
}

function renderList(values: string[]) {
  return values.map((value) => `- ${value}`).join("\n");
}

export function formatKnowledgeStudyGuide(guide: KnowledgeStudyGuide) {
  return [
    `## 一句话结论\n${guide.coreAnswer}`,
    `## 面试回答\n${guide.interviewAnswer}`,
    `## 考点定位\n${renderList(guide.problemContext)}`,
    `## 思路\n${renderList(guide.thinkingPath)}`,
    `## 步骤\n${renderList(guide.keySteps)}`,
    `## 示例\n${guide.exampleOrCode}`,
    `## 复杂度与取舍\n${renderList(guide.tradeoffs)}`,
    `## 易错点\n${renderList(guide.pitfalls)}`,
    `## 常见追问\n${renderList(guide.followUps)}`,
    `## 项目连接\n${renderList(guide.projectHooks)}`,
    `## 复习清单\n${renderList(guide.reviewChecklist)}`,
  ].join("\n\n");
}
