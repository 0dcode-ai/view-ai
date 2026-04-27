export type SeedQuestion = {
  question: string;
  answer: string;
  companyName?: string;
  topicName: string;
  roleDirection: string;
  questionType: string;
  abilityDimension: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  priorityScore: number;
  source?: string;
  note?: string;
};

export const seedQuestions: SeedQuestion[] = [
  {
    question: "MySQL 索引为什么能提升查询速度？什么情况下会失效？",
    answer: "索引通过 B+Tree 等结构减少扫描范围。常见失效场景包括对索引列做函数或隐式转换、最左前缀不满足、范围查询后续列无法继续利用、低区分度字段收益低。回答时要结合 explain、回表、覆盖索引和真实慢 SQL 优化案例。",
    topicName: "MySQL",
    roleDirection: "后端",
    questionType: "八股",
    abilityDimension: "基础知识",
    tags: ["MySQL", "索引", "慢查询"],
    difficulty: "medium",
    priorityScore: 86,
  },
  {
    question: "Redis 缓存穿透、击穿、雪崩分别是什么？怎么处理？",
    answer: "穿透是查询不存在数据导致请求打到 DB，可用布隆过滤器和空值缓存；击穿是热点 key 失效，可用互斥锁、逻辑过期、提前刷新；雪崩是大量 key 同时失效，可用随机过期、限流降级、多级缓存。最好补充项目中的容量、过期策略和监控指标。",
    topicName: "Redis",
    roleDirection: "后端",
    questionType: "八股",
    abilityDimension: "工程稳定性",
    tags: ["Redis", "缓存", "高并发"],
    difficulty: "medium",
    priorityScore: 88,
  },
  {
    question: "React 中 useMemo 和 useCallback 的使用场景是什么？",
    answer: "useMemo 缓存计算结果，useCallback 缓存函数引用，主要用于减少昂贵计算或避免子组件无意义渲染。不要滥用，依赖数组错误会造成陈旧闭包。回答时结合列表渲染、复杂筛选、memo 子组件和性能测量。",
    topicName: "React",
    roleDirection: "前端",
    questionType: "八股",
    abilityDimension: "前端性能",
    tags: ["React", "性能优化", "Hooks"],
    difficulty: "easy",
    priorityScore: 76,
  },
  {
    question: "讲一个你做过的性能优化，如何定位、如何验证收益？",
    answer: "建议按背景、指标、定位工具、方案、风险、结果复盘回答。技术面更看重证据链：优化前后的 P95/P99、耗时、资源占用、用户或业务指标变化，以及是否有回滚和监控。",
    topicName: "项目表达",
    roleDirection: "通用",
    questionType: "项目追问",
    abilityDimension: "项目深度",
    tags: ["项目表达", "性能优化", "量化结果"],
    difficulty: "medium",
    priorityScore: 90,
  },
  {
    question: "如何设计一个短链接系统？",
    answer: "从需求和规模估算开始，说明短码生成、唯一性、重定向链路、存储模型、缓存、热点保护、过期策略、风控和监控。重点讲清读写路径、可用性和扩展性取舍。",
    topicName: "系统设计",
    roleDirection: "后端",
    questionType: "系统设计",
    abilityDimension: "架构设计",
    tags: ["系统设计", "短链接", "高可用"],
    difficulty: "hard",
    priorityScore: 82,
  },
  {
    question: "为什么选择我们公司和这个岗位？",
    answer: "回答要连接公司业务、岗位要求和自己的经历。结构可以是：我理解的业务方向、岗位需要的能力、我过去的相关证据、加入后能贡献什么。避免只说平台大、想学习。",
    topicName: "行为面试",
    roleDirection: "通用",
    questionType: "行为面试",
    abilityDimension: "动机匹配",
    tags: ["HR 面", "动机", "岗位匹配"],
    difficulty: "easy",
    priorityScore: 70,
  },
];
