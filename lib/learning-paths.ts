export type LearningPath = {
  role: string;
  headline: string;
  stages: Array<{
    title: string;
    goal: string;
    topics: string[];
    drill: string;
  }>;
};

export const learningPaths: LearningPath[] = [
  {
    role: "后端",
    headline: "先稳基础与项目表达，再补系统设计和高并发场景。",
    stages: [
      {
        title: "基础盘点",
        goal: "把语言、数据库、缓存、网络的高频八股过一遍。",
        topics: ["Java/Go/Node 基础", "MySQL", "Redis", "HTTP/TCP"],
        drill: "每天复述 5 张低掌握卡，每张都绑定一个项目场景。",
      },
      {
        title: "项目深挖",
        goal: "准备 2 个能被连续追问 20 分钟的项目。",
        topics: ["性能优化", "故障排查", "技术取舍", "量化结果"],
        drill: "按背景、目标、方案、难点、结果、复盘重写项目回答。",
      },
      {
        title: "系统设计",
        goal: "能讲清容量估算、核心链路、存储、缓存和稳定性。",
        topics: ["短链接", "秒杀", "消息队列", "限流降级"],
        drill: "每次画一个核心链路，再用模拟面试追问扩展性。",
      },
    ],
  },
  {
    role: "前端",
    headline: "围绕框架原理、工程化、性能与项目业务价值组织训练。",
    stages: [
      {
        title: "框架与语言",
        goal: "补齐 JS/TS、React/Vue、浏览器和网络基础。",
        topics: ["TypeScript", "React Hooks", "状态管理", "浏览器渲染"],
        drill: "每张卡按原理、场景、坑点、项目应用来复述。",
      },
      {
        title: "工程与性能",
        goal: "能解释构建、监控、首屏、稳定性和体验优化。",
        topics: ["Vite/Webpack", "首屏优化", "错误监控", "组件设计"],
        drill: "准备 3 个性能或工程化案例，补充优化前后数据。",
      },
      {
        title: "业务项目",
        goal: "把 UI、数据流、权限、复杂交互和协作讲清楚。",
        topics: ["复杂表单", "权限模型", "数据可视化", "协作流程"],
        drill: "用白板拆一个页面的状态流和接口链路。",
      },
    ],
  },
  {
    role: "AI 应用",
    headline: "突出模型接入、评测、RAG、工具调用和产品落地能力。",
    stages: [
      {
        title: "模型调用基础",
        goal: "能讲清 prompt、结构化输出、重试、流式和成本控制。",
        topics: ["OpenAI-compatible API", "JSON 输出", "流式响应", "限流重试"],
        drill: "准备一个模型接入项目，说明失败兜底和评测方法。",
      },
      {
        title: "RAG 与工具",
        goal: "能解释检索、切分、召回、重排、引用和工具调用。",
        topics: ["Embedding", "向量库", "RAG", "Function Calling"],
        drill: "画出 RAG 链路，列出每层可观测指标。",
      },
      {
        title: "上线与评测",
        goal: "补齐安全、延迟、质量和业务指标闭环。",
        topics: ["离线评测", "A/B 测试", "安全过滤", "可观测性"],
        drill: "用复盘报告拆一次模型效果变差的排查路径。",
      },
    ],
  },
];

export function pickLearningPath(role?: string | null) {
  if (!role) {
    return learningPaths[0];
  }
  return learningPaths.find((path) => role.includes(path.role)) ?? learningPaths[0];
}
