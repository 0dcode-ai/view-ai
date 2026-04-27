import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  DailyData,
  ExperienceReport,
  InterviewSession,
  JobTarget,
  KnowledgeCard,
  LabSession,
  ResumeProfile,
  ReviewCard,
  SprintPlan,
} from "@interview/shared";
import type { Session } from "@supabase/supabase-js";
import { api } from "./src/api";
import { supabase, supabaseAuthConfigured } from "./src/supabase";

type TabKey = "today" | "knowledge" | "interview" | "more";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!supabaseAuthConfigured) {
      setBooting(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooting(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  if (booting) {
    return <Loading label="正在启动" />;
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      {session || !supabaseAuthConfigured ? <AuthedApp /> : <AuthScreen />}
    </SafeAreaView>
  );
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(mode: "signIn" | "signUp") {
    setBusy(true);
    try {
      const result =
        mode === "signIn"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
    } catch (error) {
      Alert.alert("登录失败", error instanceof Error ? error.message : "请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.auth}>
      <Text style={styles.logo}>Interview AI</Text>
      <Text style={styles.muted}>手机端面试训练工作台</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="邮箱"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="密码"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Pressable disabled={busy} style={styles.primaryButton} onPress={() => submit("signIn")}>
        <Text style={styles.primaryButtonText}>{busy ? "处理中..." : "登录"}</Text>
      </Pressable>
      <Pressable disabled={busy} style={styles.secondaryButton} onPress={() => submit("signUp")}>
        <Text style={styles.secondaryButtonText}>注册新账号</Text>
      </Pressable>
    </View>
  );
}

function AuthedApp() {
  const [tab, setTab] = useState<TabKey>("today");

  return (
    <View style={styles.app}>
      {tab === "today" && <TodayScreen />}
      {tab === "knowledge" && <KnowledgeScreen />}
      {tab === "interview" && <InterviewScreen />}
      {tab === "more" && <MoreScreen />}
      <View style={styles.tabbar}>
        {[
          ["today", "今日"],
          ["knowledge", "题库"],
          ["interview", "面试"],
          ["more", "更多"],
        ].map(([key, label]) => (
          <Pressable key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key as TabKey)}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TodayScreen() {
  const [data, setData] = useState<DailyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      setData(await api.get<DailyData>("/daily"));
    } catch (error) {
      showError(error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (!data && refreshing) return <Loading label="加载今日任务" />;

  return (
    <Screen title="今日任务" refreshing={refreshing} onRefresh={load}>
      <View style={styles.metrics}>
        <Metric label="待复习" value={data?.summary.dueKnowledge ?? 0} />
        <Metric label="复盘卡" value={data?.summary.todoReview ?? 0} />
        <Metric label="冲刺任务" value={data?.summary.sprintTasks ?? 0} />
      </View>
      <Section title="知识复习">
        {(data?.dueCards ?? []).map((card) => (
          <KnowledgeItem key={card.id} card={card} />
        ))}
        {!data?.dueCards.length && <Empty text="暂无待复习题卡" />}
      </Section>
      <Section title="复盘卡">
        {(data?.reviewCards ?? []).map((card) => (
          <Card key={card.id} title={card.title} subtitle={card.suggestion} />
        ))}
        {!data?.reviewCards.length && <Empty text="暂无复盘卡" />}
      </Section>
    </Screen>
  );
}

function KnowledgeScreen() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const payload = await api.get<{ cards: KnowledgeCard[] }>(`/knowledge${params}`);
      setCards(payload.cards);
    } catch (error) {
      showError(error);
    } finally {
      setRefreshing(false);
    }
  }

  async function review(card: KnowledgeCard) {
    try {
      await api.patch(`/knowledge/${card.id}/progress`, {
        mastery: Math.min(card.mastery + 1, 4),
        markReviewed: true,
      });
      await load();
    } catch (error) {
      showError(error);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen title="题库复习" refreshing={refreshing} onRefresh={load}>
      <View style={styles.searchRow}>
        <TextInput placeholder="搜索题目、答案、标签" style={[styles.input, styles.searchInput]} value={query} onChangeText={setQuery} />
        <Pressable style={styles.smallButton} onPress={load}>
          <Text style={styles.smallButtonText}>搜索</Text>
        </Pressable>
      </View>
      {cards.map((card) => (
        <KnowledgeItem key={card.id} card={card} actionLabel="复习" onAction={() => review(card)} />
      ))}
      {!cards.length && <Empty text="暂无题卡，可从公共题库导入" />}
      <QuestionTemplateImporter onImported={load} />
    </Screen>
  );
}

function QuestionTemplateImporter({ onImported }: { onImported: () => void }) {
  const [busy, setBusy] = useState(false);
  const [templateId, setTemplateId] = useState<number | null>(null);

  async function loadFirstTemplate() {
    setBusy(true);
    try {
      const payload = await api.get<{ templates: Array<{ templateId: number; question: string }> }>("/question-templates?take=1");
      const first = payload.templates[0];
      if (!first) {
        Alert.alert("公共题库为空", "请先在后端运行 question template import。");
        return;
      }
      setTemplateId(first.templateId);
      await api.post(`/question-templates/${first.templateId}/adopt`);
      await onImported();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable style={styles.secondaryButton} disabled={busy} onPress={loadFirstTemplate}>
      <Text style={styles.secondaryButtonText}>{busy ? "导入中..." : templateId ? "继续导入公共题" : "导入一道公共题"}</Text>
    </Pressable>
  );
}

function InterviewScreen() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  const openTurn = useMemo(() => session?.turns.find((turn) => !turn.answer), [session]);

  async function start() {
    setBusy(true);
    try {
      const payload = await api.post<{ session: InterviewSession }>("/interviews/start", {
        mode: "mixed",
        roundType: "first_round",
        deliveryMode: "text",
        targetRole: "后端工程师",
      });
      setSession(payload.session);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!session || !answer.trim()) return;
    setBusy(true);
    try {
      const payload = await api.post<{ session: InterviewSession; shouldFinish: boolean }>(`/interviews/${session.id}/answer`, {
        answer,
        transcriptSource: "text",
        answerDurationSec: 90,
      });
      setAnswer("");
      setSession(payload.session);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!session) return;
    setBusy(true);
    try {
      const payload = await api.post<{ session: InterviewSession }>(`/interviews/${session.id}/finish`);
      setSession(payload.session);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="模拟面试">
      {!session ? (
        <Pressable style={styles.primaryButton} disabled={busy} onPress={start}>
          <Text style={styles.primaryButtonText}>{busy ? "创建中..." : "开始一轮 5 题模拟"}</Text>
        </Pressable>
      ) : (
        <>
          <Card title={session.status === "finished" ? "已完成" : `第 ${openTurn?.order ?? session.turns.length} 题`} subtitle={openTurn?.question ?? session.summary ?? "本轮已回答完，可结束复盘。"} />
          {openTurn && (
            <>
              <TextInput
                multiline
                placeholder="输入你的回答"
                style={[styles.input, styles.answerInput]}
                value={answer}
                onChangeText={setAnswer}
              />
              <Pressable style={styles.primaryButton} disabled={busy} onPress={submit}>
                <Text style={styles.primaryButtonText}>{busy ? "提交中..." : "提交回答"}</Text>
              </Pressable>
            </>
          )}
          <Pressable style={styles.secondaryButton} disabled={busy} onPress={finish}>
            <Text style={styles.secondaryButtonText}>结束并生成复盘</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

function MoreScreen() {
  const [snapshot, setSnapshot] = useState<{
    resumes: ResumeProfile[];
    jobTargets: JobTarget[];
    reviews: ReviewCard[];
    sprints: SprintPlan[];
    labs: LabSession[];
    experiences: ExperienceReport[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const [resumes, jobTargets, reviews, sprints, labs, experiences] = await Promise.all([
        api.get<{ resumes: ResumeProfile[] }>("/resumes"),
        api.get<{ jobTargets: JobTarget[] }>("/job-targets"),
        api.get<{ reviewCards: ReviewCard[] }>("/reviews"),
        api.get<{ sprintPlans: SprintPlan[] }>("/sprints"),
        api.get<{ labSessions: LabSession[] }>("/labs"),
        api.get<{ experiences: ExperienceReport[] }>("/experiences"),
      ]);
      setSnapshot({
        resumes: resumes.resumes,
        jobTargets: jobTargets.jobTargets,
        reviews: reviews.reviewCards,
        sprints: sprints.sprintPlans,
        labs: labs.labSessions,
        experiences: experiences.experiences,
      });
    } catch (error) {
      showError(error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen title="更多功能" refreshing={refreshing} onRefresh={load}>
      <View style={styles.metrics}>
        <Metric label="简历" value={snapshot?.resumes.length ?? 0} />
        <Metric label="JD" value={snapshot?.jobTargets.length ?? 0} />
        <Metric label="复盘" value={snapshot?.reviews.length ?? 0} />
      </View>
      <View style={styles.metrics}>
        <Metric label="冲刺" value={snapshot?.sprints.length ?? 0} />
        <Metric label="实验室" value={snapshot?.labs.length ?? 0} />
        <Metric label="面经" value={snapshot?.experiences.length ?? 0} />
      </View>
      <Section title="账号">
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            if (!supabaseAuthConfigured) {
              Alert.alert("开发模式", "当前未配置 Supabase，后端需设置 AUTH_DISABLED=true。");
              return;
            }
            void supabase.auth.signOut();
          }}
        >
          <Text style={styles.secondaryButtonText}>{supabaseAuthConfigured ? "退出登录" : "开发模式已启用"}</Text>
        </Pressable>
      </Section>
    </Screen>
  );
}

function Screen({
  title,
  children,
  refreshing = false,
  onRefresh,
}: {
  title: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function KnowledgeItem({ card, actionLabel, onAction }: { card: KnowledgeCard; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{card.question}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={3}>
        {card.answer}
      </Text>
      <View style={styles.pillRow}>
        <Text style={styles.pill}>{card.topic?.name ?? "未分类"}</Text>
        <Text style={styles.pill}>掌握 {card.mastery}</Text>
      </View>
      {onAction && (
        <Pressable style={styles.smallButton} onPress={onAction}>
          <Text style={styles.smallButtonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function Card({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function Loading({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function showError(error: unknown) {
  Alert.alert("出错了", error instanceof Error ? error.message : "请稍后重试");
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  app: {
    flex: 1,
  },
  screen: {
    padding: 18,
    paddingBottom: 96,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  auth: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  logo: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
  },
  muted: {
    color: "#64748b",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  answerInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingVertical: 13,
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  smallButton: {
    alignSelf: "flex-start",
    borderRadius: 9,
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  smallButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  metrics: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricLabel: {
    marginTop: 3,
    color: "#64748b",
  },
  section: {
    gap: 9,
  },
  sectionTitle: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  cardSubtitle: {
    color: "#475569",
    lineHeight: 20,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 16,
  },
  loading: {
    flex: 1,
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabbar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 6,
    gap: 5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    borderRadius: 13,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: "#0f172a",
  },
  tabText: {
    color: "#64748b",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },
});
