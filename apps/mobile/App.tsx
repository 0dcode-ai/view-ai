import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type TabKey = "today" | "library" | "interview" | "sprint" | "more";

type DemoQuestion = {
  id: number;
  title: string;
  answer: string;
  topic: string;
  level: "高频" | "进阶" | "系统设计";
  company: string;
  mastery: number;
};

type DemoTask = {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  minutes: number;
};

type DemoTurn = {
  question: string;
  focus: string;
  modelAnswer: string;
};

const questions: DemoQuestion[] = [
  {
    id: 1,
    title: "Redis 的缓存穿透、击穿、雪崩分别怎么处理？",
    answer: "穿透用布隆过滤器和空值缓存；击穿用互斥锁或逻辑过期；雪崩用过期时间随机化、限流降级和多级缓存。",
    topic: "Redis",
    level: "高频",
    company: "字节/美团",
    mastery: 3,
  },
  {
    id: 2,
    title: "MySQL 索引为什么会失效？如何排查？",
    answer: "常见原因包括函数包裹、隐式类型转换、最左前缀不匹配、范围条件后列失效。排查用 explain 看 type、key、rows 和 extra。",
    topic: "MySQL",
    level: "高频",
    company: "腾讯/阿里",
    mastery: 2,
  },
  {
    id: 3,
    title: "如何设计一个高并发秒杀系统？",
    answer: "核心是流量削峰、库存预扣、异步下单、幂等防重、热点隔离、限流熔断和最终一致性。面试里要按链路拆解。",
    topic: "系统设计",
    level: "系统设计",
    company: "京东/快手",
    mastery: 1,
  },
  {
    id: 4,
    title: "Java 线程池的核心参数和拒绝策略是什么？",
    answer: "核心参数包括核心线程数、最大线程数、队列、keepAlive、线程工厂、拒绝策略。拒绝策略要结合业务选择降级、丢弃或回退。",
    topic: "并发",
    level: "进阶",
    company: "滴滴/小红书",
    mastery: 4,
  },
  {
    id: 5,
    title: "Kafka 如何保证消息不丢失？",
    answer: "生产端 acks=all 和重试，Broker 端副本同步，消费端手动提交 offset，并配合幂等消费处理重复。",
    topic: "MQ",
    level: "进阶",
    company: "B站/网易",
    mastery: 2,
  },
];

const tasks: DemoTask[] = [
  { id: 1, title: "复习 Redis 高频题 12 道", subtitle: "重点补齐穿透、击穿、雪崩表达", tag: "题库", minutes: 25 },
  { id: 2, title: "完成一轮后端模拟面试", subtitle: "5 题混合面，生成复盘卡", tag: "面试", minutes: 35 },
  { id: 3, title: "优化项目经历 STAR 表达", subtitle: "把性能优化项目讲成业务影响", tag: "简历", minutes: 20 },
  { id: 4, title: "查看目标公司面经情报", subtitle: "匹配近 90 天高频题和面试轮次", tag: "情报", minutes: 15 },
];

const interviewTurns: DemoTurn[] = [
  {
    question: "你负责过的系统里，最有挑战的一次性能优化是什么？",
    focus: "项目深挖",
    modelAnswer: "建议用背景、瓶颈、方案、指标提升四段回答，明确 QPS、耗时、成本或稳定性收益。",
  },
  {
    question: "如果 Redis 热 key 打爆单节点，你会怎么治理？",
    focus: "架构治理",
    modelAnswer: "先定位热 key，再做本地缓存、读写拆分、key 拆散、限流降级，最后补监控和自动发现。",
  },
  {
    question: "讲一下你对事务隔离级别和 MVCC 的理解。",
    focus: "基础深度",
    modelAnswer: "从并发问题讲起，再解释 undo log、read view、版本链，以及 RC/RR 下 read view 创建时机差异。",
  },
];

const filters = ["全部", "Redis", "MySQL", "系统设计", "并发", "MQ"];

export default function App() {
  const [tab, setTab] = useState<TabKey>("today");
  const [completed, setCompleted] = useState<number[]>([2]);
  const [mastered, setMastered] = useState<number[]>([]);

  const completedCount = completed.length;
  const readiness = Math.round(((completedCount + mastered.length) / 9) * 100);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        {tab === "today" && (
          <TodayScreen
            completed={completed}
            readiness={readiness}
            onToggleTask={(id) =>
              setCompleted((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]))
            }
          />
        )}
        {tab === "library" && (
          <LibraryScreen
            mastered={mastered}
            onMaster={(id) => setMastered((items) => (items.includes(id) ? items : [...items, id]))}
          />
        )}
        {tab === "interview" && <InterviewScreen />}
        {tab === "sprint" && <SprintScreen completed={completed} />}
        {tab === "more" && <MoreScreen />}
        <TabBar value={tab} onChange={setTab} />
      </View>
    </SafeAreaView>
  );
}

function TodayScreen({
  completed,
  readiness,
  onToggleTask,
}: {
  completed: number[];
  readiness: number;
  onToggleTask: (id: number) => void;
}) {
  const minutesLeft = tasks.filter((task) => !completed.includes(task.id)).reduce((sum, task) => sum + task.minutes, 0);

  return (
    <Screen>
      <Hero
        eyebrow="Demo Mode"
        title="今天把面试准备推进到可复盘"
        subtitle="移动端演示数据已内置，不依赖后端服务。"
        aside={`${readiness}%`}
      />

      <View style={styles.metrics}>
        <Metric label="完成度" value={`${readiness}%`} tone="green" />
        <Metric label="剩余任务" value={String(tasks.length - completed.length)} tone="blue" />
        <Metric label="预计用时" value={`${minutesLeft}m`} tone="coral" />
      </View>

      <Section title="今日任务" action="智能排序">
        {tasks.map((task) => {
          const done = completed.includes(task.id);
          return (
            <Pressable key={task.id} style={[styles.taskCard, done && styles.taskCardDone]} onPress={() => onToggleTask(task.id)}>
              <View style={[styles.check, done && styles.checkDone]}>
                <Text style={[styles.checkText, done && styles.checkTextDone]}>{done ? "✓" : ""}</Text>
              </View>
              <View style={styles.taskBody}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, done && styles.lineThrough]}>{task.title}</Text>
                  <Text style={styles.timeText}>{task.minutes}m</Text>
                </View>
                <Text style={styles.cardSubtitle}>{task.subtitle}</Text>
                <Text style={styles.softTag}>{task.tag}</Text>
              </View>
            </Pressable>
          );
        })}
      </Section>

      <Section title="AI 复盘摘要" action="生成报告">
        <InsightCard
          title="当前短板"
          body="系统设计题能讲方案，但缺少容量估算、降级策略和可观测性闭环。建议今天优先练秒杀和热 key 两类题。"
          score="B+"
        />
      </Section>
    </Screen>
  );
}

function LibraryScreen({ mastered, onMaster }: { mastered: number[]; onMaster: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const [openId, setOpenId] = useState(questions[0]?.id ?? 0);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return questions.filter((question) => {
      const hitFilter = filter === "全部" || question.topic === filter;
      const hitKeyword = !keyword || `${question.title}${question.answer}${question.company}`.toLowerCase().includes(keyword);
      return hitFilter && hitKeyword;
    });
  }, [filter, query]);

  return (
    <Screen>
      <PageHeader title="题库复习" subtitle="公共题库、个人掌握度、公司高频题合在一个工作台。" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="搜索题目、答案、公司"
        placeholderTextColor="#94a3b8"
        style={styles.search}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map((item) => (
          <Pressable key={item} style={[styles.chip, filter === item && styles.chipActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {visible.map((question) => {
        const open = openId === question.id;
        const done = mastered.includes(question.id);
        return (
          <Pressable key={question.id} style={styles.questionCard} onPress={() => setOpenId(open ? 0 : question.id)}>
            <View style={styles.rowBetween}>
              <Text style={styles.questionTopic}>{question.topic}</Text>
              <Text style={[styles.levelTag, question.level === "系统设计" && styles.levelTagHot]}>{question.level}</Text>
            </View>
            <Text style={styles.cardTitle}>{question.title}</Text>
            <Text style={styles.cardMeta}>{question.company} · 掌握度 {done ? 5 : question.mastery}/5</Text>
            {open && (
              <View style={styles.answerBox}>
                <Text style={styles.answerText}>{question.answer}</Text>
                <Pressable style={styles.primaryMiniButton} onPress={() => onMaster(question.id)}>
                  <Text style={styles.primaryMiniButtonText}>{done ? "已加入今日掌握" : "标记掌握"}</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

function InterviewScreen() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const turn = interviewTurns[index] ?? interviewTurns[0];

  if (!turn) {
    return null;
  }

  function next() {
    setIndex((value) => (value + 1) % interviewTurns.length);
    setAnswer("");
    setSubmitted(false);
  }

  return (
    <Screen>
      <PageHeader title="模拟面试" subtitle="演示版内置面试官追问、评分和表达建议。" />
      <View style={styles.interviewPanel}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
        <View style={styles.interviewCopy}>
          <Text style={styles.questionTopic}>{turn.focus}</Text>
          <Text style={styles.interviewQuestion}>{turn.question}</Text>
        </View>
      </View>

      <TextInput
        multiline
        value={answer}
        onChangeText={setAnswer}
        placeholder="输入一段回答，点击提交后查看演示反馈"
        placeholderTextColor="#94a3b8"
        style={styles.answerInput}
      />

      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButton} onPress={() => setSubmitted(true)}>
          <Text style={styles.primaryButtonText}>提交回答</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={next}>
          <Text style={styles.secondaryButtonText}>下一题</Text>
        </Pressable>
      </View>

      {submitted && (
        <Section title="即时复盘" action="已生成">
          <View style={styles.reviewPanel}>
            <Metric label="结构" value="82" tone="green" />
            <Metric label="深度" value="76" tone="blue" />
            <Metric label="表达" value="88" tone="coral" />
          </View>
          <InsightCard title="更好的回答方式" body={turn.modelAnswer} score="A-" />
        </Section>
      )}
    </Screen>
  );
}

function SprintScreen({ completed }: { completed: number[] }) {
  return (
    <Screen>
      <PageHeader title="冲刺计划" subtitle="把简历、JD、题库和面经聚合成 7 天准备路线。" />
      <View style={styles.matchCard}>
        <View>
          <Text style={styles.matchTitle}>后端工程师 · AI 平台方向</Text>
          <Text style={styles.cardSubtitle}>目标公司：0dcode AI · 匹配度 86%</Text>
        </View>
        <Text style={styles.matchScore}>86</Text>
      </View>

      <Section title="能力雷达" action="JD 匹配">
        <ProgressRow label="Java / Spring" value={92} color="#16a34a" />
        <ProgressRow label="Redis / MQ" value={84} color="#2563eb" />
        <ProgressRow label="系统设计" value={73} color="#f97316" />
        <ProgressRow label="项目表达" value={68} color="#7c3aed" />
      </Section>

      <Section title="7 天冲刺路线" action={`${completed.length}/4 今日完成`}>
        {[
          ["Day 1", "基础高频题压缩复习", "Redis、MySQL、并发"],
          ["Day 2", "项目经历深挖", "性能优化、稳定性、业务指标"],
          ["Day 3", "系统设计专项", "秒杀、消息队列、热点治理"],
          ["Day 4", "模拟面试 + 复盘", "表达节奏、追问补强"],
        ].map(([day, title, subtitle]) => (
          <View key={day} style={styles.timelineItem}>
            <Text style={styles.timelineDay}>{day}</Text>
            <View style={styles.timelineBody}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
          </View>
        ))}
      </Section>
    </Screen>
  );
}

function MoreScreen() {
  return (
    <Screen>
      <PageHeader title="演示中心" subtitle="这些模块先做成可展示前端，后面再逐步接真实 API。" />
      <View style={styles.featureGrid}>
        <FeatureCard title="简历解析" value="4 个亮点" description="项目经历、技术栈、风险点、追问题。" tone="green" />
        <FeatureCard title="JD 匹配" value="86%" description="能力匹配、差距清单、补题建议。" tone="blue" />
        <FeatureCard title="面经情报" value="128 条" description="公司题频、轮次、候选人反馈。" tone="coral" />
        <FeatureCard title="实验室" value="3 个" description="系统设计、代码题、表达训练。" tone="purple" />
      </View>

      <Section title="公司情报卡" action="演示数据">
        <InsightCard
          title="0dcode AI · 后端方向"
          body="近期面试更关注 AI Agent 工程落地、RAG 检索链路、服务稳定性和复杂项目拆解。建议准备一个可量化的 Agent 项目案例。"
          score="Hot"
        />
      </Section>

      <Section title="复盘卡片">
        {["系统设计缺少容量估算", "项目表达缺少业务指标", "并发题需要补充源码细节"].map((item, idx) => (
          <View key={item} style={styles.reviewItem}>
            <Text style={styles.reviewIndex}>{idx + 1}</Text>
            <Text style={styles.reviewText}>{item}</Text>
          </View>
        ))}
      </Section>
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

function Hero({
  eyebrow,
  title,
  subtitle,
  aside,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  aside: string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.heroBadge}>
        <Text style={styles.heroBadgeValue}>{aside}</Text>
        <Text style={styles.heroBadgeLabel}>Ready</Text>
      </View>
    </View>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageSubtitle}>{subtitle}</Text>
    </View>
  );
}

function Section({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && <Text style={styles.sectionAction}>{action}</Text>}
      </View>
      {children}
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" | "coral" }) {
  return (
    <View style={[styles.metric, tone === "green" && styles.metricGreen, tone === "blue" && styles.metricBlue, tone === "coral" && styles.metricCoral]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function InsightCard({ title, body, score }: { title: string; body: string; score: string }) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.scoreBadge}>{score}</Text>
      </View>
      <Text style={styles.cardSubtitle}>{body}</Text>
    </View>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.rowBetween}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function FeatureCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: "green" | "blue" | "coral" | "purple";
}) {
  const toneStyle = {
    green: styles.featureGreen,
    blue: styles.featureBlue,
    coral: styles.featureCoral,
    purple: styles.featurePurple,
  }[tone];

  return (
    <View style={[styles.featureCard, toneStyle]}>
      <Text style={styles.featureValue}>{value}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

function TabBar({ value, onChange }: { value: TabKey; onChange: (tab: TabKey) => void }) {
  const items: Array<[TabKey, string]> = [
    ["today", "今日"],
    ["library", "题库"],
    ["interview", "面试"],
    ["sprint", "冲刺"],
    ["more", "更多"],
  ];

  return (
    <View style={styles.tabbar}>
      {items.map(([key, label]) => {
        const active = value === key;
        return (
          <Pressable key={key} style={[styles.tab, active && styles.tabActive]} onPress={() => onChange(key)}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#eef2f7",
  },
  app: {
    flex: 1,
  },
  screen: {
    padding: 18,
    paddingBottom: 112,
    gap: 16,
  },
  hero: {
    minHeight: 184,
    borderRadius: 28,
    backgroundColor: "#0f172a",
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  heroContent: {
    flex: 1,
    gap: 8,
  },
  heroEyebrow: {
    color: "#93c5fd",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 28,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "#cbd5e1",
    lineHeight: 20,
  },
  heroBadge: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadgeValue: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 24,
  },
  heroBadgeLabel: {
    color: "#64748b",
    fontWeight: "800",
    fontSize: 11,
  },
  pageHeader: {
    gap: 6,
  },
  pageTitle: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "900",
  },
  pageSubtitle: {
    color: "#64748b",
    lineHeight: 21,
  },
  metrics: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    minHeight: 82,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  metricGreen: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  metricBlue: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  metricCoral: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 23,
    fontWeight: "900",
  },
  metricLabel: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionAction: {
    color: "#2563eb",
    fontWeight: "800",
    fontSize: 12,
  },
  taskCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  taskCardDone: {
    backgroundColor: "#f8fafc",
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkDone: {
    borderColor: "#16a34a",
    backgroundColor: "#16a34a",
  },
  checkText: {
    color: "#fff",
    fontWeight: "900",
  },
  checkTextDone: {
    color: "#fff",
  },
  taskBody: {
    flex: 1,
    gap: 7,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
    lineHeight: 21,
  },
  cardSubtitle: {
    color: "#64748b",
    lineHeight: 20,
  },
  cardMeta: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  lineThrough: {
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  timeText: {
    color: "#64748b",
    fontWeight: "800",
    fontSize: 12,
  },
  softTag: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "800",
  },
  insightCard: {
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 10,
  },
  scoreBadge: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#0f172a",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "900",
    fontSize: 12,
  },
  search: {
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0f172a",
  },
  chips: {
    gap: 8,
    paddingRight: 18,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  chipText: {
    color: "#64748b",
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#fff",
  },
  questionCard: {
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 9,
  },
  questionTopic: {
    color: "#2563eb",
    fontWeight: "900",
    fontSize: 12,
  },
  levelTag: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    color: "#15803d",
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontWeight: "900",
    fontSize: 11,
  },
  levelTagHot: {
    backgroundColor: "#fff7ed",
    color: "#c2410c",
  },
  answerBox: {
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    padding: 12,
  },
  answerText: {
    color: "#334155",
    lineHeight: 21,
  },
  primaryMiniButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  primaryMiniButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  interviewPanel: {
    borderRadius: 28,
    backgroundColor: "#111827",
    padding: 18,
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#60a5fa",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "900",
  },
  interviewCopy: {
    flex: 1,
    gap: 8,
  },
  interviewQuestion: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "900",
  },
  answerInput: {
    minHeight: 158,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 15,
    color: "#0f172a",
    fontSize: 15,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  reviewPanel: {
    flexDirection: "row",
    gap: 10,
  },
  matchCard: {
    borderRadius: 28,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
  matchScore: {
    color: "#16a34a",
    fontSize: 34,
    fontWeight: "900",
  },
  progressRow: {
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 9,
  },
  progressLabel: {
    color: "#334155",
    fontWeight: "800",
  },
  progressValue: {
    color: "#0f172a",
    fontWeight: "900",
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: 9,
    borderRadius: 999,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDay: {
    width: 58,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#0f172a",
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 13,
  },
  timelineBody: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 5,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureCard: {
    width: "48.5%",
    minHeight: 142,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    gap: 7,
  },
  featureGreen: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  featureBlue: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  featureCoral: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  featurePurple: {
    backgroundColor: "#f5f3ff",
    borderColor: "#ddd6fe",
  },
  featureValue: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  featureTitle: {
    color: "#0f172a",
    fontWeight: "900",
  },
  featureDescription: {
    color: "#475569",
    lineHeight: 18,
    fontSize: 12,
  },
  reviewItem: {
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewIndex: {
    width: 28,
    height: 28,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    color: "#0f172a",
    textAlign: "center",
    paddingTop: 5,
    fontWeight: "900",
  },
  reviewText: {
    flex: 1,
    color: "#334155",
    fontWeight: "800",
  },
  tabbar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    minHeight: 64,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    flexDirection: "row",
    padding: 7,
    gap: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#0f172a",
  },
  tabText: {
    color: "#64748b",
    fontWeight: "900",
    fontSize: 12,
  },
  tabTextActive: {
    color: "#fff",
  },
});
