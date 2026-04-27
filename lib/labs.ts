export type LabType = "coding" | "system_design" | "peer_mock";

export type LabTemplate = {
  type: LabType;
  title: string;
  prompt: string;
  starterCode?: string;
};

export function createLabTemplate(type: LabType, roleDirection?: string | null): LabTemplate {
  const role = roleDirection?.trim() || "目标岗位";

  if (type === "coding") {
    return {
      type,
      title: `${role} 代码面试练习`,
      prompt: "实现 LRU Cache：支持 get/put，平均时间复杂度 O(1)。提交时说明数据结构、边界条件和复杂度。",
      starterCode: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n\n  get(key) {\n    // TODO\n  }\n\n  put(key, value) {\n    // TODO\n  }\n}\n`,
    };
  }

  if (type === "system_design") {
    return {
      type,
      title: `${role} 系统设计白板`,
      prompt: "设计一个面试题/八股复习系统。请画出用户、API、题库、模拟面试、复盘、复习调度的核心链路，并说明瓶颈与扩展方案。",
    };
  }

  return {
    type,
    title: `${role} 同伴 mock 脚本`,
    prompt: "和同伴进行 30 分钟 mock：5 分钟自我介绍，15 分钟项目深挖，5 分钟八股追问，5 分钟反向提问。结束后互相给出一个优点、一个最大问题、三个下一步动作。",
  };
}

export function reviewLabAnswer(input: {
  type: LabType | string;
  prompt: string;
  content: string;
}) {
  const content = input.content.trim();
  const hasComplexity = /O\(|复杂度|时间|空间/.test(content);
  const hasTradeoff = /取舍|瓶颈|扩展|风险|边界/.test(content);
  const hasStructure = /思路|方案|步骤|首先|其次|最后|模块|链路/.test(content);
  const score = Math.min(
    100,
    45 + (content.length > 200 ? 20 : 8) + (hasComplexity ? 12 : 0) + (hasTradeoff ? 13 : 0) + (hasStructure ? 10 : 0),
  );

  return {
    score,
    strengths: [
      hasStructure ? "回答有基本结构。" : "已经完成一次提交，可以继续补结构。",
      content.length > 200 ? "内容长度足够展开追问。" : "适合作为第一版草稿。",
    ],
    gaps: [
      hasComplexity ? "继续补充边界用例。" : "补充复杂度或容量估算。",
      hasTradeoff ? "可以进一步量化收益。" : "补充技术取舍、瓶颈和风险。",
    ],
    nextAction:
      input.type === "coding"
        ? "下一轮请补测试用例和复杂度说明。"
        : input.type === "system_design"
          ? "下一轮请补核心链路、数据模型、容量估算和降级策略。"
          : "下一轮请请同伴按评分表追问，并记录 3 个低分点。",
  };
}
