import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  AnswerInterviewInput,
  AnswerInterviewBySessionInput,
  CreateAgentRunLogInput,
  AgentRunInput,
  CreateApplicationInput,
  CreateExperienceInput,
  CreateKnowledgeInput,
  CreateSourceDocumentInput,
  CreateResumeVersionInput,
  GenerateSprintInput,
  FinishInterviewInput,
  ParseExperienceInput,
  ParseJobTargetInput,
  ParseResumeInput,
  StartInterviewInput,
  StartLabInput,
  SubmitLabInput,
  UpdateAgentConfigInput,
  UpdateApplicationInput,
  UpdateResumeVersionInput,
  UpdateKnowledgeProgressInput,
  UpdateKnowledgeInput,
  UpdateReviewInput,
  UpdateResumeInput,
} from "@interview/shared";
import type { Prisma } from "./generated/prisma";
import { PrismaService } from "./prisma.service";
import type { AuthUser } from "./auth/auth-user";
import {
  serializeExperienceReport,
  serializeAgentConfig,
  serializeAgentRunLog,
  serializeApplication,
  serializeApplicationActivity,
  serializeInterviewSession,
  serializeJobTarget,
  serializeKnowledgeCard,
  serializeLabSession,
  serializeQuestionTemplate,
  serializeResumeProfile,
  serializeReviewCard,
  serializeSourceDocument,
  serializeResumeVersion,
  serializeSprintPlan,
  serializeSprintTask,
} from "./serializers";
import { normalizeTags, safeJsonParse, tagsToJson } from "./utils/json";
import { nextReviewDate, priorityFromReview } from "./utils/srs";

type Query = Record<string, string | undefined>;
type SeedQuestion = {
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

const includeKnowledge = { company: true, topic: true } as const;
const includeQuestionTemplate = { company: true, topic: true } as const;
const includeResume = {};
const includeJobTarget = { company: true, resumeProfile: true } as const;
const includeApplication = {
  company: true,
  resumeProfile: true,
  jobTarget: { include: { company: true, resumeProfile: true } },
  interviewSessions: true,
  reviewCards: true,
  sprintPlans: { include: { tasks: true } },
  sourceDocuments: true,
  activities: true,
  resumeVersions: true,
} as const;
const includeResumeVersion = {} as const;
const includeSourceDocument = {
  application: true,
  chunks: true,
} as const;
const includeSession = {
  application: { include: includeApplication },
  company: true,
  jobTarget: { include: { company: true, resumeProfile: true } },
  resumeProfile: true,
  turns: true,
} as const;
const includeReview = {
  knowledgeCard: { include: { company: true, topic: true } },
  session: true,
} as const;
const includeSprint = {
  company: true,
  jobTarget: { include: { company: true, resumeProfile: true } },
  resumeProfile: true,
  tasks: true,
} as const;
const includeExperience = { company: true, rounds: true } as const;
const learningPaths = [
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
] as const;
const knownAgents = [
  { agentName: "knowledge-record", displayName: "快速记录八股整理 Agent" },
  { agentName: "startup-idea", displayName: "创业想法 Agent" },
  { agentName: "candidate-prep", displayName: "候选人准备 Agent" },
  { agentName: "github-repo", displayName: "GitHub 仓库分析 Agent" },
  { agentName: "application-match", displayName: "求职机会匹配 Agent" },
  { agentName: "resume-tailor", displayName: "简历定制 Agent" },
] as const;

@Injectable()
export class CoreService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async ensureUser(user: AuthUser) {
    return this.prisma.userProfile.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: { id: user.id, email: user.email },
    });
  }

  async health() {
    return { ok: true, service: "interview-api", version: "0.1.0" };
  }

  async listAgentConfigs(user: AuthUser) {
    await this.ensureUser(user);
    await Promise.all(
      knownAgents.map((agent) =>
        this.prisma.agentConfig.upsert({
          where: { userId_agentName: { userId: user.id, agentName: agent.agentName } },
          update: {},
          create: {
            userId: user.id,
            agentName: agent.agentName,
            displayName: agent.displayName,
            model: process.env.OPENAI_MODEL || "GLM-5.1",
          },
        }),
      ),
    );
    const configs = await this.prisma.agentConfig.findMany({
      where: { userId: user.id },
      orderBy: [{ agentName: "asc" }],
    });

    return { agents: configs.map(serializeAgentConfig) };
  }

  async updateAgentConfig(user: AuthUser, agentName: string, input: UpdateAgentConfigInput) {
    await this.ensureUser(user);
    const defaultAgent = knownAgents.find((agent) => agent.agentName === agentName);
    const config = await this.prisma.agentConfig.upsert({
      where: { userId_agentName: { userId: user.id, agentName } },
      update: {
        ...(input.displayName !== undefined ? { displayName: input.displayName?.trim() || null } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.model !== undefined ? { model: input.model?.trim() || null } : {}),
        ...(input.config !== undefined ? { configJson: JSON.stringify(input.config) } : {}),
        ...(input.prompt !== undefined ? { promptJson: JSON.stringify(input.prompt) } : {}),
      },
      create: {
        userId: user.id,
        agentName,
        displayName: input.displayName?.trim() || defaultAgent?.displayName || agentName,
        enabled: input.enabled ?? true,
        model: input.model?.trim() || process.env.OPENAI_MODEL || "GLM-5.1",
        configJson: JSON.stringify(input.config ?? {}),
        promptJson: JSON.stringify(input.prompt ?? {}),
      },
    });

    return { agent: serializeAgentConfig(config) };
  }

  async listAgentRunLogs(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const logs = await this.prisma.agentRunLog.findMany({
      where: {
        userId: user.id,
        ...(query.agentName ? { agentName: query.agentName } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(query.take ?? 50), 200),
    });

    return { logs: logs.map(serializeAgentRunLog) };
  }

  async createAgentRunLog(user: AuthUser, input: CreateAgentRunLogInput) {
    await this.ensureUser(user);
    const log = await this.prisma.agentRunLog.create({
      data: {
        userId: user.id,
        agentName: input.agentName,
        status: input.status,
        model: input.model?.trim() || null,
        usedFallback: input.usedFallback,
        latencyMs: input.latencyMs ?? null,
        resourceType: input.resourceType?.trim() || null,
        resourceId: input.resourceId?.trim() || null,
        inputJson: JSON.stringify(input.input ?? {}),
        outputJson: JSON.stringify(input.output ?? {}),
        errorJson: JSON.stringify(input.error ?? {}),
        tokenUsageJson: JSON.stringify(input.tokenUsage ?? {}),
      },
    });

    return { log: serializeAgentRunLog(log) };
  }

  async runAgent(user: AuthUser, agentName: string, input: AgentRunInput) {
    await this.ensureUser(user);
    const startedAt = Date.now();
    const config = await this.prisma.agentConfig.upsert({
      where: { userId_agentName: { userId: user.id, agentName } },
      update: {},
      create: {
        userId: user.id,
        agentName,
        displayName: knownAgents.find((agent) => agent.agentName === agentName)?.displayName ?? agentName,
        model: process.env.OPENAI_MODEL || "GLM-5.1",
      },
    });
    const sourceIds = input.sourceIds ?? [];
    const sources = sourceIds.length
      ? await this.prisma.sourceDocument.findMany({
          where: { userId: user.id, id: { in: sourceIds } },
          include: includeSourceDocument,
        })
      : [];
    const application = input.applicationId
      ? await this.prisma.application.findFirst({
          where: { id: input.applicationId, userId: user.id },
          include: includeApplication,
        })
      : null;
    const result = buildAgentFallbackOutput({
      agentName,
      input: input.input ?? {},
      application: application ? serializeApplication(application) : null,
      sources: sources.map(serializeSourceDocument),
    });
    const latencyMs = Date.now() - startedAt;
    const log = await this.prisma.agentRunLog.create({
      data: {
        userId: user.id,
        agentName,
        status: result.usedFallback ? "fallback" : "success",
        model: config.model || process.env.OPENAI_MODEL || "GLM-5.1",
        usedFallback: result.usedFallback,
        latencyMs,
        resourceType: input.resourceType?.trim() || (application ? "application" : null),
        resourceId: input.resourceId?.trim() || (application ? String(application.id) : null),
        inputJson: JSON.stringify(input.input ?? {}),
        outputJson: JSON.stringify(result.output),
        errorJson: JSON.stringify({}),
        tokenUsageJson: JSON.stringify({}),
      },
    });

    return {
      output: result.output,
      execution: {
        steps: result.steps,
        model: config.model || process.env.OPENAI_MODEL || "GLM-5.1",
        usedFallback: result.usedFallback,
        latencyMs,
      },
      evidence: result.evidence,
      log: serializeAgentRunLog(log),
    };
  }

  async listApplications(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const applications = await this.prisma.application.findMany({
      where: {
        userId: user.id,
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q } },
                { roleName: { contains: query.q } },
                { note: { contains: query.q } },
                { company: { is: { name: { contains: query.q } } } },
              ],
            }
          : {}),
      },
      include: includeApplication,
      orderBy: [{ updatedAt: "desc" }],
      take: Math.min(Number(query.take ?? 50), 100),
    });

    return { applications: applications.map(serializeApplication) };
  }

  async createApplication(user: AuthUser, input: CreateApplicationInput) {
    await this.ensureUser(user);
    const [company, resume, jobTarget] = await Promise.all([
      input.companyId
        ? this.prisma.company.findUnique({ where: { id: input.companyId } })
        : this.findOrCreateCompany(input.companyName),
      input.resumeProfileId ? this.prisma.resumeProfile.findFirst({ where: { id: input.resumeProfileId, userId: user.id } }) : null,
      input.jobTargetId ? this.prisma.jobTarget.findFirst({ where: { id: input.jobTargetId, userId: user.id }, include: includeJobTarget }) : null,
    ]);
    if (input.resumeProfileId && !resume) {
      throw new NotFoundException("简历不存在。");
    }
    if (input.jobTargetId && !jobTarget) {
      throw new NotFoundException("岗位目标不存在。");
    }
    const roleName = input.roleName.trim();
    const application = await this.prisma.application.create({
      data: {
        userId: user.id,
        companyId: company?.id ?? jobTarget?.companyId ?? null,
        resumeProfileId: resume?.id ?? jobTarget?.resumeProfileId ?? null,
        jobTargetId: jobTarget?.id ?? null,
        title: input.title?.trim() || `${company?.name ?? jobTarget?.company?.name ?? "目标公司"} · ${roleName}`,
        roleName,
        level: input.level,
        salaryK: input.salaryK ?? null,
        status: input.status,
        interviewDate: parseOptionalDate(input.interviewDate),
        nextAction: input.nextAction?.trim() || "补齐 JD、简历和一次模拟面试。",
        note: input.note?.trim() || null,
      },
      include: includeApplication,
    });

    return { application: serializeApplication(application) };
  }

  async updateApplication(user: AuthUser, id: number, input: UpdateApplicationInput) {
    await this.ensureUser(user);
    const existing = await this.prisma.application.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("求职机会不存在。");
    }
    const company = input.companyId
      ? await this.prisma.company.findUnique({ where: { id: input.companyId } })
      : input.companyName !== undefined
        ? await this.findOrCreateCompany(input.companyName)
        : undefined;
    const application = await this.prisma.application.update({
      where: { id },
      data: {
        ...(company !== undefined ? { companyId: company?.id ?? null } : {}),
        ...(input.resumeProfileId !== undefined ? { resumeProfileId: input.resumeProfileId ?? null } : {}),
        ...(input.jobTargetId !== undefined ? { jobTargetId: input.jobTargetId ?? null } : {}),
        ...(input.title !== undefined ? { title: input.title?.trim() || existing.title } : {}),
        ...(input.roleName !== undefined ? { roleName: input.roleName.trim() } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.salaryK !== undefined ? { salaryK: input.salaryK ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.interviewDate !== undefined ? { interviewDate: parseOptionalDate(input.interviewDate) } : {}),
        ...(input.progress !== undefined ? { progressJson: JSON.stringify(input.progress) } : {}),
        ...(input.nextAction !== undefined ? { nextAction: input.nextAction?.trim() || null } : {}),
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      },
      include: includeApplication,
    });

    return { application: serializeApplication(application) };
  }

  private async refreshApplicationNextAction(applicationId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: includeApplication,
    });
    if (!application) {
      return;
    }
    const serialized = serializeApplication(application);
    const nextAction = serialized.progress.nextActions[0] ?? "继续下一轮模拟，并把复盘卡转成行动任务。";
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        nextAction,
        progressJson: JSON.stringify(serialized.progress),
        status: application.status === "tracking" ? "preparing" : application.status,
      },
    });
  }

  async listSources(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const sources = await this.prisma.sourceDocument.findMany({
      where: {
        userId: user.id,
        ...(query.applicationId ? { applicationId: Number(query.applicationId) } : {}),
        ...(query.sourceType ? { sourceType: query.sourceType } : {}),
      },
      include: includeSourceDocument,
      orderBy: { updatedAt: "desc" },
      take: Math.min(Number(query.take ?? 50), 100),
    });

    return { sources: sources.map(serializeSourceDocument) };
  }

  async createSource(user: AuthUser, input: CreateSourceDocumentInput) {
    await this.ensureUser(user);
    if (input.applicationId) {
      const application = await this.prisma.application.findFirst({ where: { id: input.applicationId, userId: user.id } });
      if (!application) {
        throw new NotFoundException("求职机会不存在。");
      }
    }
    const chunks = splitSourceChunks(input.content);
    const source = await this.prisma.sourceDocument.create({
      data: {
        userId: user.id,
        applicationId: input.applicationId ?? null,
        title: input.title.trim(),
        sourceType: input.sourceType,
        content: input.content,
        metadataJson: JSON.stringify(input.metadata ?? {}),
        chunks: {
          create: chunks.map((chunk, index) => ({
            chunkIndex: index,
            content: chunk,
            tokenCount: estimateTokenCount(chunk),
          })),
        },
      },
      include: includeSourceDocument,
    });

    return { source: serializeSourceDocument(source) };
  }

  async findOrCreateCompany(name: string | null | undefined) {
    const cleanName = name?.trim();
    if (!cleanName) {
      return null;
    }

    return this.prisma.company.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName },
    });
  }

  async findOrCreateTopic(name: string | null | undefined) {
    const cleanName = name?.trim();
    if (!cleanName) {
      return null;
    }

    return this.prisma.topic.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName },
    });
  }

  async listKnowledge(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const where = {
      userId: user.id,
      ...this.knowledgeWhere(query),
    };
    const cards = await this.prisma.knowledgeCard.findMany({
      where,
      include: includeKnowledge,
      orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
      take: Number(query.take ?? 100),
    });
    const [companies, topics] = await Promise.all([
      this.prisma.company.findMany({ orderBy: { name: "asc" } }),
      this.prisma.topic.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      cards: cards.map(serializeKnowledgeCard),
      companies: companies.map((company) => ({ id: company.id, name: company.name })),
      topics: topics.map((topic) => ({ id: topic.id, name: topic.name })),
      tags: Array.from(new Set(cards.flatMap((card) => normalizeTags(safeJsonParse<string[]>(card.tagsJson, []))))).sort((left, right) =>
        left.localeCompare(right, "zh-Hans-CN"),
      ),
    };
  }

  async createKnowledge(user: AuthUser, input: CreateKnowledgeInput) {
    await this.ensureUser(user);
    const [company, topic] = await Promise.all([
      this.findOrCreateCompany(input.companyName),
      this.findOrCreateTopic(input.topicName),
    ]);
    const card = await this.prisma.knowledgeCard.create({
      data: {
        userId: user.id,
        question: input.question.trim(),
        answer: input.answer.trim(),
        companyId: company?.id,
        topicId: topic?.id,
        roleDirection: input.roleDirection?.trim() || null,
        questionType: input.questionType?.trim() || "technical",
        abilityDimension: input.abilityDimension?.trim() || "基础知识",
        mastery: input.mastery ?? 0,
        priorityScore: input.priorityScore ?? 50,
        tagsJson: tagsToJson(input.tags),
        difficulty: input.difficulty,
        source: input.source?.trim() || null,
        note: input.note?.trim() || null,
      },
      include: includeKnowledge,
    });

    return { card: serializeKnowledgeCard(card), aiSuggestion: null };
  }

  async updateKnowledgeProgress(user: AuthUser, id: number, input: UpdateKnowledgeProgressInput) {
    await this.ensureUser(user);
    const existing = await this.prisma.knowledgeCard.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("学习卡不存在。");
    }

    const mastery = input.mastery ?? existing.mastery;
    const mistakeCount = Math.max(0, existing.mistakeCount + (input.mistakeDelta ?? 0));
    const reviewCount = existing.reviewCount + (input.reviewDelta ?? (input.markReviewed ? 1 : 0));
    const card = await this.prisma.knowledgeCard.update({
      where: { id },
      data: {
        mastery,
        reviewCount,
        mistakeCount,
        lastReviewedAt: input.markReviewed ? new Date() : existing.lastReviewedAt,
        nextReviewAt:
          input.nextReviewAt === null
            ? null
            : input.nextReviewAt
              ? new Date(input.nextReviewAt)
              : input.markReviewed
                ? nextReviewDate({ mastery, reviewCount, mistakeCount })
                : existing.nextReviewAt,
        priorityScore:
          input.priorityScore ??
          priorityFromReview({
            priorityScore: existing.priorityScore,
            mastery,
            markReviewed: input.markReviewed,
            mistakeDelta: input.mistakeDelta,
          }),
      },
      include: includeKnowledge,
    });

    return { card: serializeKnowledgeCard(card) };
  }

  async updateKnowledge(user: AuthUser, id: number, input: UpdateKnowledgeInput) {
    await this.ensureUser(user);
    const existing = await this.prisma.knowledgeCard.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("学习卡不存在。");
    }

    const [company, topic] = await Promise.all([
      input.companyName === undefined ? undefined : this.findOrCreateCompany(input.companyName),
      input.topicName === undefined ? undefined : this.findOrCreateTopic(input.topicName),
    ]);
    const card = await this.prisma.knowledgeCard.update({
      where: { id },
      data: {
        ...(input.question !== undefined ? { question: input.question.trim() } : {}),
        ...(input.answer !== undefined ? { answer: input.answer.trim() } : {}),
        ...(input.companyName !== undefined ? { companyId: company?.id ?? null } : {}),
        ...(input.topicName !== undefined ? { topicId: topic?.id ?? null } : {}),
        ...(input.roleDirection !== undefined ? { roleDirection: input.roleDirection?.trim() || null } : {}),
        ...(input.questionType !== undefined ? { questionType: input.questionType.trim() || "technical" } : {}),
        ...(input.abilityDimension !== undefined ? { abilityDimension: input.abilityDimension.trim() || "基础知识" } : {}),
        ...(input.mastery !== undefined ? { mastery: input.mastery } : {}),
        ...(input.priorityScore !== undefined ? { priorityScore: input.priorityScore } : {}),
        ...(input.tags !== undefined ? { tagsJson: tagsToJson(input.tags) } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
        ...(input.source !== undefined ? { source: input.source?.trim() || null } : {}),
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      },
      include: includeKnowledge,
    });

    return { card: serializeKnowledgeCard(card) };
  }

  async deleteKnowledge(user: AuthUser, id: number) {
    await this.ensureUser(user);
    const existing = await this.prisma.knowledgeCard.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("学习卡不存在。");
    }

    await this.prisma.knowledgeCard.delete({ where: { id } });
    return { ok: true };
  }

  async listQuestionTemplates(query: Query) {
    const templates = await this.prisma.questionTemplate.findMany({
      where: this.templateWhere(query),
      include: includeQuestionTemplate,
      orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
      take: Number(query.take ?? 100),
    });

    return { templates: templates.map(serializeQuestionTemplate) };
  }

  async adoptQuestionTemplate(user: AuthUser, templateId: number) {
    await this.ensureUser(user);
    const template = await this.prisma.questionTemplate.findUnique({
      where: { id: templateId },
      include: includeQuestionTemplate,
    });
    if (!template) {
      throw new NotFoundException("题库模板不存在。");
    }

    const existing = await this.prisma.knowledgeCard.findFirst({
      where: { userId: user.id, templateId },
      include: includeKnowledge,
    });
    if (existing) {
      return { card: serializeKnowledgeCard(existing), created: false };
    }

    const card = await this.prisma.knowledgeCard.create({
      data: {
        userId: user.id,
        templateId,
        question: template.question,
        answer: template.answer,
        companyId: template.companyId,
        topicId: template.topicId,
        roleDirection: template.roleDirection,
        questionType: template.questionType,
        abilityDimension: template.abilityDimension,
        priorityScore: template.priorityScore,
        tagsJson: template.tagsJson,
        difficulty: template.difficulty,
        source: template.source,
        note: template.note,
      },
      include: includeKnowledge,
    });

    return { card: serializeKnowledgeCard(card), created: true };
  }

  async importQuestionTemplates() {
    const filePath =
      process.env.QUESTION_TEMPLATE_JSON_PATH ||
      path.resolve(process.cwd(), "../../data/interview-internal-reference.json");
    const content = await readFile(filePath, "utf8");
    const input = JSON.parse(content) as SeedQuestion[];
    let created = 0;
    let skipped = 0;

    for (const item of input) {
      const sourceKey = makeSourceKey(item);
      const existing = await this.prisma.questionTemplate.findUnique({ where: { sourceKey } });
      if (existing) {
        skipped += 1;
        continue;
      }

      const [company, topic] = await Promise.all([
        this.findOrCreateCompany(item.companyName),
        this.findOrCreateTopic(item.topicName),
      ]);
      await this.prisma.questionTemplate.create({
        data: {
          sourceKey,
          question: item.question,
          answer: item.answer,
          companyId: company?.id,
          topicId: topic?.id,
          roleDirection: item.roleDirection,
          questionType: item.questionType,
          abilityDimension: item.abilityDimension,
          tagsJson: tagsToJson(item.tags),
          difficulty: item.difficulty,
          priorityScore: item.priorityScore,
          source: item.source ?? "0voice/interview_internal_reference",
          note: item.note,
        },
      });
      created += 1;
    }

    return { created, skipped, total: await this.prisma.questionTemplate.count() };
  }

  async daily(user: AuthUser) {
    await this.ensureUser(user);
    const now = new Date();
    const [dueCards, reviewCards, sprintTasks] = await Promise.all([
      this.prisma.knowledgeCard.findMany({
        where: { userId: user.id, OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }] },
        include: includeKnowledge,
        orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
        take: 10,
      }),
      this.prisma.reviewCard.findMany({
        where: { userId: user.id, status: "todo" },
        include: includeReview,
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        take: 10,
      }),
      this.prisma.sprintTask.findMany({
        where: { status: { not: "done" }, plan: { userId: user.id, status: "active" } },
        orderBy: [{ dayIndex: "asc" }, { updatedAt: "desc" }],
        take: 10,
      }),
    ]);

    return {
      summary: {
        dueKnowledge: dueCards.length,
        todoReview: reviewCards.length,
        sprintTasks: sprintTasks.length,
        total: dueCards.length + reviewCards.length + sprintTasks.length,
      },
      dueCards: dueCards.map(serializeKnowledgeCard),
      reviewCards: reviewCards.map(serializeReviewCard),
      sprintTasks: sprintTasks.map(serializeSprintTask),
    };
  }

  async listResumes(user: AuthUser) {
    await this.ensureUser(user);
    const resumes = await this.prisma.resumeProfile.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return { resumes: resumes.map(serializeResumeProfile) };
  }

  async parseResume(user: AuthUser, input: ParseResumeInput) {
    await this.ensureUser(user);
    const parsed = parseResumeText(input.rawText);
    const resume = await this.prisma.resumeProfile.create({
      data: {
        userId: user.id,
        title: input.title || "我的简历",
        rawText: input.rawText,
        parsedJson: JSON.stringify(parsed),
        followUpQuestionsJson: JSON.stringify(parsed.followUpQuestions),
      },
    });
    return { resume: serializeResumeProfile(resume) };
  }

  async updateResume(user: AuthUser, id: number, input: UpdateResumeInput) {
    await this.ensureUser(user);
    const existing = await this.prisma.resumeProfile.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("简历不存在。");
    }

    const resume = await this.prisma.resumeProfile.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.candidatePrep !== undefined ? { candidatePrepJson: JSON.stringify(input.candidatePrep) } : {}),
      },
    });

    return { resume: serializeResumeProfile(resume) };
  }

  async deleteResume(user: AuthUser, id: number) {
    await this.ensureUser(user);
    const existing = await this.prisma.resumeProfile.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("简历不存在。");
    }

    await this.prisma.resumeProfile.delete({ where: { id } });
    return { ok: true };
  }

  async listJobTargets(user: AuthUser) {
    await this.ensureUser(user);
    const jobTargets = await this.prisma.jobTarget.findMany({
      where: { userId: user.id },
      include: includeJobTarget,
      orderBy: { updatedAt: "desc" },
    });
    return { jobTargets: jobTargets.map(serializeJobTarget) };
  }

  async parseJobTarget(user: AuthUser, input: ParseJobTargetInput) {
    await this.ensureUser(user);
    const [company, resume] = await Promise.all([
      this.findOrCreateCompany(input.companyName),
      input.resumeProfileId ? this.prisma.resumeProfile.findFirst({ where: { id: input.resumeProfileId, userId: user.id } }) : null,
    ]);
    if (input.resumeProfileId && !resume) {
      throw new NotFoundException("简历不存在。");
    }
    const parsed = parseJdText(input.rawJd);
    const match = {
      matchScore: 72,
      strengths: parsed.requiredSkills.slice(0, 3),
      gaps: parsed.riskPoints.slice(0, 3),
      projectTalkTracks: parsed.interviewFocus.slice(0, 3),
    };
    const target = await this.prisma.jobTarget.create({
      data: {
        userId: user.id,
        companyId: company?.id,
        resumeProfileId: resume?.id,
        roleName: input.roleName,
        rawJd: input.rawJd,
        parsedJson: JSON.stringify(parsed),
        matchJson: JSON.stringify(match),
      },
      include: includeJobTarget,
    });
    return { jobTarget: serializeJobTarget(target) };
  }

  async listInterviews(user: AuthUser) {
    await this.ensureUser(user);
    const sessions = await this.prisma.interviewSession.findMany({
      where: { userId: user.id },
      include: includeSession,
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return { sessions: sessions.map(serializeInterviewSession) };
  }

  async startInterview(user: AuthUser, input: StartInterviewInput) {
    await this.ensureUser(user);
    const application = input.applicationId
      ? await this.prisma.application.findFirst({ where: { id: input.applicationId, userId: user.id }, include: includeApplication })
      : null;
    if (input.applicationId && !application) {
      throw new NotFoundException("求职机会不存在。");
    }
    const company = application?.company ?? (await this.findOrCreateCompany(input.targetCompanyName));
    const difficulty = inferInterviewDifficulty(input.seniority, input.salaryK, input.difficulty);
    const targetRole = input.targetRole || application?.roleName || null;
    const firstQuestion = buildQuestion(targetRole, input.mode, 1, difficulty);
    const difficultyContext = buildDifficultyContext(input.seniority, input.salaryK, difficulty);
    const session = await this.prisma.interviewSession.create({
      data: {
        userId: user.id,
        mode: input.mode,
        roundType: input.roundType,
        deliveryMode: input.deliveryMode,
        targetRole,
        applicationId: application?.id ?? null,
        targetCompanyId: company?.id,
        resumeProfileId: input.resumeProfileId ?? application?.resumeProfileId ?? null,
        jobTargetId: input.jobTargetId ?? application?.jobTargetId ?? null,
        expressionJson: JSON.stringify({
          difficultyContext,
          applicationId: application?.id ?? null,
          rubricVersion: "application-v1",
          deliveryMetrics: {},
        }),
        turns: {
          create: {
            order: 1,
            question: firstQuestion,
            questionSource: "general",
          },
        },
      },
      include: includeSession,
    });
    return { session: serializeInterviewSession(session) };
  }

  async answerInterview(user: AuthUser, sessionId: number, input: AnswerInterviewInput) {
    await this.ensureUser(user);
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: { turns: true },
    });
    if (!session) {
      throw new NotFoundException("面试不存在。");
    }
    const openTurn = session.turns.sort((a, b) => a.order - b.order).find((turn) => !turn.answer);
    if (!openTurn) {
      throw new NotFoundException("没有待回答的问题。");
    }
    const score = scoreAnswer(input.answer);
    const answeredTurn = await this.prisma.interviewTurn.update({
      where: { id: openTurn.id },
      data: {
        answer: input.answer,
        feedback: score.feedback,
        betterAnswer: score.betterAnswer,
        transcriptSource: input.transcriptSource,
        answerDurationSec: input.answerDurationSec,
        expressionJson: JSON.stringify(input.expression ?? {}),
        scoreJson: JSON.stringify(score.score),
      },
    });
    const shouldFinish = openTurn.order >= 5;
    const difficultyContext = safeJsonParse<{ difficultyContext?: { difficulty?: string } }>(session.expressionJson, {}).difficultyContext;
    const nextTurn = shouldFinish
      ? null
      : await this.prisma.interviewTurn.create({
          data: {
            sessionId,
            order: openTurn.order + 1,
            question: buildQuestion(session.targetRole, session.mode, openTurn.order + 1, difficultyContext?.difficulty),
            questionSource: "general",
          },
        });
    const refreshed = await this.prisma.interviewSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: includeSession,
    });

    return {
      answeredTurn: serializeInterviewTurnLoose(answeredTurn),
      nextTurn: nextTurn ? serializeInterviewTurnLoose(nextTurn) : null,
      shouldFinish,
      session: serializeInterviewSession(refreshed),
    };
  }

  answerInterviewBySession(user: AuthUser, input: AnswerInterviewBySessionInput) {
    return this.answerInterview(user, input.sessionId, {
      answer: input.answer,
      transcriptSource: input.transcriptSource,
      answerDurationSec: input.answerDurationSec,
      expression: input.expression,
    });
  }

  finishInterviewBySession(user: AuthUser, input: FinishInterviewInput) {
    return this.finishInterview(user, input.sessionId);
  }

  async finishInterview(user: AuthUser, sessionId: number) {
    await this.ensureUser(user);
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: user.id },
      include: { turns: true },
    });
    if (!session) {
      throw new NotFoundException("面试不存在。");
    }
    const answered = session.turns.filter((turn) => turn.answer);
    const overall = averageScore(answered.map((turn) => safeJsonParse<Record<string, number>>(turn.scoreJson, {})));
    const reviewCards = await Promise.all(
      answered.slice(0, 3).map((turn) =>
        this.prisma.reviewCard.create({
          data: {
            userId: user.id,
            sessionId,
            title: `复盘：${turn.question.slice(0, 24)}`,
            weakness: turn.feedback || "回答还可以继续补充结构、量化结果和项目上下文。",
            suggestion: turn.betterAnswer || "按背景、方案、结果、复盘组织一次更完整的回答。",
            priority: Math.max(50, 90 - turn.order * 8),
            applicationId: session.applicationId,
            tagsJson: tagsToJson(["面试复盘", session.mode]),
          },
          include: includeReview,
        }),
      ),
    );
    const refreshed = await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "finished",
        summary: `本轮完成 ${answered.length} 个问题，综合得分 ${overall}。`,
        scoreJson: JSON.stringify({ overall, resume: overall, knowledge: overall, expression: overall, jdMatch: overall }),
        expressionJson: JSON.stringify({
          ...safeJsonParse<Record<string, unknown>>(session.expressionJson, {}),
          deliveryMetrics: buildDeliveryMetrics(answered),
        }),
      },
      include: includeSession,
    });

    if (session.applicationId) {
      await this.refreshApplicationNextAction(session.applicationId);
    }

    return { session: serializeInterviewSession(refreshed), reviewCards: reviewCards.map(serializeReviewCard) };
  }

  async listReviews(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const reviewCards = await this.prisma.reviewCard.findMany({
      where: {
        userId: user.id,
        ...(query.status ? { status: query.status } : {}),
      },
      include: includeReview,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: Number(query.take ?? 100),
    });
    return { reviewCards: reviewCards.map(serializeReviewCard) };
  }

  async updateReview(user: AuthUser, id: number, input: UpdateReviewInput) {
    await this.ensureUser(user);
    const current = await this.prisma.reviewCard.findFirst({
      where: { id, userId: user.id },
      include: includeReview,
    });
    if (!current) {
      throw new NotFoundException("复盘卡不存在。");
    }

    const dueAt = parseOptionalDate(input.dueAt);
    let sprintTask = null;

    if (input.createTask) {
      const companyId = current.session?.targetCompanyId ?? current.knowledgeCard?.companyId ?? null;
      const marker = `复盘卡 #${current.id}`;
      const existingPlan = await this.prisma.sprintPlan.findFirst({
        where: {
          userId: user.id,
          title: "复盘行动清单",
          ...(companyId ? { companyId } : {}),
          status: "active",
        },
        include: { tasks: true },
        orderBy: { updatedAt: "desc" },
      });
      const plan =
        existingPlan ??
        (await this.prisma.sprintPlan.create({
          data: {
            userId: user.id,
            title: "复盘行动清单",
            applicationId: current.applicationId ?? null,
            companyId,
            jobTargetId: current.session?.jobTargetId ?? null,
            resumeProfileId: current.session?.resumeProfileId ?? null,
            targetRole: current.session?.targetRole ?? current.knowledgeCard?.roleDirection ?? null,
            days: 7,
            summary: "把面试复盘卡拆成可以每天推进的行动任务。",
          },
          include: { tasks: true },
        }));
      const existingTask = plan.tasks.find((task) => task.type === "review" && task.description.includes(marker));

      sprintTask =
        existingTask ??
        (await this.prisma.sprintTask.create({
          data: {
            planId: plan.id,
            dayIndex: 0,
            type: "review",
            title: current.title,
            description: `${current.suggestion}\n${marker}`,
            status: "todo",
            dueDate: dueAt === undefined ? current.dueAt ?? new Date() : dueAt,
          },
        }));
    }

    const reviewCard = await this.prisma.reviewCard.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(dueAt !== undefined ? { dueAt } : {}),
      },
      include: includeReview,
    });

    return {
      reviewCard: serializeReviewCard(reviewCard),
      sprintTask: sprintTask ? serializeSprintTask(sprintTask) : null,
    };
  }

  async listSprints(user: AuthUser) {
    await this.ensureUser(user);
    const sprintPlans = await this.prisma.sprintPlan.findMany({
      where: { userId: user.id },
      include: includeSprint,
      orderBy: { updatedAt: "desc" },
    });
    return { sprintPlans: sprintPlans.map(serializeSprintPlan) };
  }

  async generateSprint(user: AuthUser, input: GenerateSprintInput) {
    await this.ensureUser(user);
    const plan = await this.prisma.sprintPlan.create({
      data: {
        userId: user.id,
        applicationId: input.applicationId,
        companyId: input.companyId,
        jobTargetId: input.jobTargetId,
        resumeProfileId: input.resumeProfileId,
        title: `${input.roleName || "面试"} ${input.days} 天冲刺`,
        targetRole: input.roleName,
        interviewDate: input.interviewDate ? new Date(input.interviewDate) : null,
        days: input.days,
        summary: "按题库复习、项目表达、模拟面试和复盘四类任务推进。",
        tasks: {
          create: Array.from({ length: input.days }, (_, index) => ({
            dayIndex: index + 1,
            type: index % 3 === 0 ? "mock" : index % 3 === 1 ? "knowledge" : "review",
            title: `Day ${index + 1} 训练`,
            description: "完成今日题库复习、表达打磨和一次小复盘。",
          })),
        },
      },
      include: includeSprint,
    });
    return { sprintPlan: serializeSprintPlan(plan) };
  }

  async updateSprintTask(user: AuthUser, id: number, status: "todo" | "doing" | "done") {
    await this.ensureUser(user);
    const existing = await this.prisma.sprintTask.findFirst({ where: { id, plan: { userId: user.id } } });
    if (!existing) {
      throw new NotFoundException("任务不存在。");
    }
    const task = await this.prisma.sprintTask.update({ where: { id }, data: { status } });
    return { task: serializeSprintTask(task) };
  }

  async listLabs(user: AuthUser) {
    await this.ensureUser(user);
    const labSessions = await this.prisma.labSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return { labSessions: labSessions.map(serializeLabSession) };
  }

  async startLab(user: AuthUser, input: StartLabInput) {
    await this.ensureUser(user);
    const template = createLabTemplate(input.type, input.roleDirection);
    const session = await this.prisma.labSession.create({
      data: {
        userId: user.id,
        type: input.type,
        roleDirection: input.roleDirection?.trim() || null,
        title: template.title,
        prompt: template.prompt,
        starterCode: template.starterCode ?? null,
        content: template.starterCode ?? "",
      },
    });
    return { labSession: serializeLabSession(session) };
  }

  async submitLab(user: AuthUser, id: number, input: SubmitLabInput) {
    await this.ensureUser(user);
    const existing = await this.prisma.labSession.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      throw new NotFoundException("练习不存在。");
    }
    const session = await this.prisma.labSession.update({
      where: { id },
      data: {
        content: input.content,
        status: "reviewed",
        feedbackJson: JSON.stringify(reviewLabAnswer({ type: existing.type, prompt: existing.prompt, content: input.content })),
      },
    });
    return { labSession: serializeLabSession(session) };
  }

  async listExperiences(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const AND: Prisma.ExperienceReportWhereInput[] = [{ userId: user.id }];
    if (query.company) AND.push({ company: { is: { name: { contains: query.company } } } });
    if (query.role) AND.push({ roleName: { contains: query.role } });
    if (query.confidence) AND.push({ confidence: query.confidence });
    if (query.roundType) AND.push({ rounds: { some: { roundType: { contains: query.roundType } } } });
    if (query.q) {
      AND.push({
        OR: [
          { rawText: { contains: query.q } },
          { summary: { contains: query.q } },
          { tagsJson: { contains: query.q } },
        ],
      });
    }
    const reports = await this.prisma.experienceReport.findMany({
      where: { AND },
      include: { company: true, rounds: true },
      orderBy: [{ interviewDate: "desc" }, { updatedAt: "desc" }],
      take: Number(query.take ?? 100),
    });
    return { experiences: reports.map(serializeExperienceReport) };
  }

  parseExperience(input: ParseExperienceInput) {
    const extracted = extractExperienceMeta(input.rawText);
    const companyName = input.companyName?.trim() || extracted.companyName;
    const roleName = input.roleName?.trim() || extracted.roleName || "后端工程师";
    const questions = extractQuestions(input.rawText);

    return {
      draft: {
        companyName,
        roleName,
        level: extracted.level,
        location: extracted.location,
        interviewDate: extracted.interviewDate,
        result: "unknown",
        difficulty: "medium",
        sourceType: "manual",
        confidence: "medium",
        verified: false,
        durationMinutes: null,
        rawText: input.rawText,
        summary: input.rawText.slice(0, 160),
        tags: normalizeTags(["面经", companyName, roleName]),
        rounds: [
          {
            order: 1,
            roundType: "technical",
            durationMinutes: null,
            interviewerStyle: null,
            focusAreas: ["项目", "基础", "系统设计"],
            questions,
            notes: input.rawText.slice(0, 200),
          },
        ],
      },
    };
  }

  async createExperience(user: AuthUser, input: CreateExperienceInput) {
    await this.ensureUser(user);
    const company = await this.findOrCreateCompany(input.companyName);
    const report = await this.prisma.experienceReport.create({
      data: {
        userId: user.id,
        companyId: company?.id,
        roleName: input.roleName,
        level: input.level,
        location: input.location,
        interviewDate: input.interviewDate ? new Date(input.interviewDate) : null,
        result: input.result,
        difficulty: input.difficulty,
        sourceType: input.sourceType,
        confidence: input.confidence,
        verified: input.verified,
        durationMinutes: input.durationMinutes ?? null,
        rawText: input.rawText,
        summary: input.summary,
        tagsJson: tagsToJson(input.tags),
        rounds: {
          create: input.rounds.map((round) => ({
            order: round.order,
            roundType: round.roundType,
            durationMinutes: round.durationMinutes,
            interviewerStyle: round.interviewerStyle,
            focusAreasJson: JSON.stringify(round.focusAreas),
            questionsJson: JSON.stringify(round.questions),
            notes: round.notes,
          })),
        },
      },
      include: includeExperience,
    });
    return { experience: serializeExperienceReport(report) };
  }

  async generateCardsFromExperience(user: AuthUser, reportId: number) {
    await this.ensureUser(user);
    const report = await this.prisma.experienceReport.findFirst({
      where: { id: reportId, userId: user.id },
      include: includeExperience,
    });
    if (!report) {
      throw new NotFoundException("面经不存在。");
    }
    const topic = await this.findOrCreateTopic(report.company?.name ? `${report.company.name} 面经` : "公司面经");
    const created = [];

    for (const round of report.rounds.sort((left, right) => left.order - right.order)) {
      const focusAreas = safeJsonParse<string[]>(round.focusAreasJson, []);
      const questions = safeJsonParse<string[]>(round.questionsJson, []);

      for (const question of questions.slice(0, 5)) {
        const cleanQuestion = question.trim();
        if (!cleanQuestion) {
          continue;
        }
        const existing = await this.prisma.knowledgeCard.findFirst({
          where: { userId: user.id, question: cleanQuestion, companyId: report.companyId },
          include: includeKnowledge,
        });
        if (existing) {
          continue;
        }

        const card = await this.prisma.knowledgeCard.create({
          data: {
            userId: user.id,
            companyId: report.companyId,
            topicId: topic?.id,
            question: cleanQuestion,
            answer: "待补充：根据面经回流的问题，请补充参考答案、项目场景和追问展开。",
            roleDirection: report.roleName,
            questionType: round.roundType.includes("系统") ? "系统设计" : round.roundType.toLowerCase().includes("coding") ? "代码题" : "面经题",
            abilityDimension: round.roundType.includes("HR") ? "动机匹配" : round.roundType.includes("系统") ? "架构设计" : "面试准备",
            mastery: 0,
            difficulty: report.difficulty,
            tagsJson: tagsToJson([report.company?.name ?? "", report.roleName, round.roundType, ...focusAreas, "面经回流"]),
            source: "面经生成",
            note: `来自面经：${report.summary ?? report.roleName}`,
            priorityScore: report.verified || report.confidence === "high" ? 88 : 78,
          },
          include: includeKnowledge,
        });
        created.push(card);
      }
    }

    return { created: created.map(serializeKnowledgeCard) };
  }

  async startInterviewFromExperience(user: AuthUser, reportId: number) {
    const report = await this.prisma.experienceReport.findFirst({ where: { id: reportId, userId: user.id }, include: includeExperience });
    if (!report) {
      throw new NotFoundException("面经不存在。");
    }
    const sortedRounds = report.rounds.sort((left, right) => left.order - right.order);
    const firstRound = sortedRounds[0];
    const firstQuestion =
      safeJsonParse<string[]>(firstRound?.questionsJson, [])[0] ??
      `请按 ${report.company?.name ?? "目标公司"} ${report.roleName} 的面经，讲一个最匹配的项目案例。`;
    const session = await this.prisma.interviewSession.create({
      data: {
        userId: user.id,
        mode: "mixed",
        roundType: mapExperienceRoundType(firstRound?.roundType),
        deliveryMode: "text",
        targetRole: report.roleName,
        targetCompanyId: report.companyId,
        turns: {
          create: {
            order: 1,
            question: firstQuestion,
            questionSource: "company",
          },
        },
      },
      include: includeSession,
    });

    return { session: serializeInterviewSession(session) };
  }

  async createDailyTasksFromExperience(user: AuthUser, reportId: number) {
    const report = await this.prisma.experienceReport.findFirst({ where: { id: reportId, userId: user.id }, include: includeExperience });
    if (!report) {
      throw new NotFoundException("面经不存在。");
    }
    const questions = report.rounds
      .sort((left, right) => left.order - right.order)
      .flatMap((round) =>
        safeJsonParse<string[]>(round.questionsJson, []).map((question) => ({
          question,
          roundType: round.roundType,
        })),
      )
      .filter((item) => item.question.trim())
      .slice(0, 7);
    const now = new Date();
    const plan = await this.prisma.sprintPlan.create({
      data: {
        userId: user.id,
        companyId: report.companyId,
        title: `${report.company?.name ?? "目标公司"} ${report.roleName} 面经训练`,
        targetRole: report.roleName,
        days: Math.max(1, questions.length || 3),
        status: "active",
        summary: "根据面经自动生成的每日训练任务，优先复述高风险题并补充项目场景。",
        tasks: {
          create: (questions.length ? questions : [{ question: report.summary ?? report.rawText.slice(0, 80), roundType: "综合" }]).map(
            (item, index) => ({
              dayIndex: index + 1,
              type: "experience",
              title: `面经复盘：${item.roundType}`,
              description: item.question,
              status: "todo",
              dueDate: new Date(now.getTime() + index * 24 * 60 * 60 * 1000),
            }),
          ),
        },
      },
      include: includeSprint,
    });

    return { sprintPlan: serializeSprintPlan(plan) };
  }

  async companyIntel(user: AuthUser, companyId: number) {
    await this.ensureUser(user);
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException("公司不存在。");
    }
    const [reports, knowledgeCards, sessions, reviewCards, jobTargets, templates] = await Promise.all([
      this.prisma.experienceReport.findMany({
        where: { userId: user.id, companyId },
        include: includeExperience,
        orderBy: [{ interviewDate: "desc" }, { updatedAt: "desc" }],
        take: 20,
      }),
      this.prisma.knowledgeCard.findMany({
        where: { userId: user.id, companyId },
        include: includeKnowledge,
        orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }],
        take: 20,
      }),
      this.prisma.interviewSession.findMany({ where: { userId: user.id, targetCompanyId: companyId } }),
      this.prisma.reviewCard.findMany({ where: { userId: user.id, session: { targetCompanyId: companyId } } }),
      this.prisma.jobTarget.findMany({ where: { userId: user.id, companyId }, orderBy: { updatedAt: "desc" }, take: 8 }),
      this.prisma.questionTemplate.findMany({ where: { companyId }, include: includeQuestionTemplate, take: 20 }),
    ]);
    const hotTopics = countTopics([...knowledgeCards.map((card) => card.abilityDimension), ...templates.map((template) => template.abilityDimension)]);
    const readiness = buildReadiness({
      jdMatchScore: jobTargets[0] ? safeJsonParse<{ matchScore?: number }>(jobTargets[0].matchJson, {}).matchScore : undefined,
      knowledgeTotal: knowledgeCards.length,
      masteredKnowledge: knowledgeCards.filter((card) => card.mastery >= 3).length,
      finishedSessions: sessions.filter((session) => session.status === "finished").length,
      todoReviews: reviewCards.filter((card) => card.status === "todo").length,
      totalReviews: reviewCards.length,
    });
    const experienceCoverage = Math.min(100, reports.length * 20);
    const roundDistribution = buildRoundDistribution(reports);
    const highFrequencyQuestions = buildHighFrequencyQuestions(reports);

    return {
      company: { id: company.id, name: company.name },
      readiness: { ...readiness, experience: experienceCoverage, overall: Math.round(readiness.overall * 0.82 + experienceCoverage * 0.18) },
      hotTopics,
      reports: reports.map(serializeExperienceReport),
      knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
      roundDistribution,
      highFrequencyQuestions,
      roleNames: [...new Set(reports.map((report) => report.roleName).filter(Boolean))],
      nextActions: [
        reports.length ? "从最近面经生成一次混合模拟。" : "先录入一条该公司的面经。",
        knowledgeCards.length ? "优先复习低掌握高优先级八股卡。" : "从面经生成公司题库。",
        reviewCards.some((card) => card.status === "todo") ? "清理待复盘卡。" : "完成一次公司定向模拟。",
      ],
    };
  }

  async companyPrep(user: AuthUser, companyId: number) {
    await this.ensureUser(user);
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException("公司不存在。");
    }
    const [jobTargets, knowledgeCards, sessions, reviewCards, sprintPlans] = await Promise.all([
      this.prisma.jobTarget.findMany({ where: { userId: user.id, companyId }, include: includeJobTarget, orderBy: { updatedAt: "desc" }, take: 12 }),
      this.prisma.knowledgeCard.findMany({ where: { userId: user.id, companyId }, include: includeKnowledge, orderBy: [{ priorityScore: "desc" }, { mastery: "asc" }], take: 30 }),
      this.prisma.interviewSession.findMany({ where: { userId: user.id, targetCompanyId: companyId }, include: includeSession, orderBy: { updatedAt: "desc" }, take: 10 }),
      this.prisma.reviewCard.findMany({ where: { userId: user.id, OR: [{ knowledgeCard: { companyId } }, { session: { targetCompanyId: companyId } }] }, include: includeReview, orderBy: [{ status: "asc" }, { priority: "desc" }], take: 20 }),
      this.prisma.sprintPlan.findMany({ where: { userId: user.id, companyId }, include: includeSprint, orderBy: { updatedAt: "desc" }, take: 5 }),
    ]);
    const bestMatch = Math.max(0, ...jobTargets.map((target) => safeJsonParse<{ matchScore?: number }>(target.matchJson, {}).matchScore ?? 0));
    const readiness = buildReadiness({
      jdMatchScore: bestMatch || undefined,
      knowledgeTotal: knowledgeCards.length,
      masteredKnowledge: knowledgeCards.filter((card) => card.mastery >= 3).length,
      finishedSessions: sessions.filter((session) => session.status === "finished").length,
      todoReviews: reviewCards.filter((card) => card.status === "todo").length,
      totalReviews: reviewCards.length,
    });

    return {
      company: { id: company.id, name: company.name },
      readiness,
      jobTargets: jobTargets.map(serializeJobTarget),
      knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
      sessions: sessions.map(serializeInterviewSession),
      reviewCards: reviewCards.map(serializeReviewCard),
      sprintPlans: sprintPlans.map(serializeSprintPlan),
    };
  }

  learningPath(role?: string) {
    const targetRole = role?.trim() ?? "";
    const activePath = pickLearningPath(targetRole);
    return {
      activePath,
      paths: learningPaths,
    };
  }

  transcribeAnswer(input: { text?: string }) {
    return { text: input.text ?? "", confidence: 1, provider: "mock" };
  }

  private knowledgeWhere(query: Query): any {
    const AND: unknown[] = [];
    if (query.company) AND.push({ company: { is: { name: { contains: query.company } } } });
    if (query.topic) AND.push({ topic: { is: { name: { contains: query.topic } } } });
    if (query.tag) AND.push({ tagsJson: { contains: query.tag } });
    if (query.difficulty) AND.push({ difficulty: query.difficulty });
    if (query.mastery && Number.isInteger(Number(query.mastery))) AND.push({ mastery: Number(query.mastery) });
    if (query.questionType) AND.push({ questionType: { contains: query.questionType } });
    if (query.abilityDimension) AND.push({ abilityDimension: { contains: query.abilityDimension } });
    if (query.roleDirection) AND.push({ roleDirection: { contains: query.roleDirection } });
    if (query.q) {
      AND.push({
        OR: [
          { question: { contains: query.q } },
          { answer: { contains: query.q } },
          { note: { contains: query.q } },
        ],
      });
    }
    return AND.length ? { AND } : {};
  }

  private templateWhere(query: Query): any {
    const AND: unknown[] = [];
    if (query.company) AND.push({ company: { is: { name: { contains: query.company } } } });
    if (query.topic) AND.push({ topic: { is: { name: { contains: query.topic } } } });
    if (query.tag) AND.push({ tagsJson: { contains: query.tag } });
    if (query.difficulty) AND.push({ difficulty: query.difficulty });
    if (query.q) {
      AND.push({
        OR: [
          { question: { contains: query.q } },
          { answer: { contains: query.q } },
          { note: { contains: query.q } },
        ],
      });
    }
    return AND.length ? { AND } : {};
  }
}

function parseResumeText(rawText: string) {
  const lines = nonEmptyLines(rawText);
  return {
    summary: lines.slice(0, 2).join(" ") || "待完善简历摘要",
    skills: lines.filter((line) => /skill|技能|技术|熟悉|掌握/i.test(line)).slice(0, 8),
    experiences: lines.filter((line) => /公司|负责|经历|工作|实习/i.test(line)).slice(0, 8),
    projects: lines.filter((line) => /项目|系统|平台|服务/i.test(line)).slice(0, 8),
    followUpQuestions: ["你负责的项目最大技术难点是什么？", "如何量化你的项目结果？", "如果重做这个项目会怎么优化？"],
  };
}

function parseJdText(rawJd: string) {
  const lines = nonEmptyLines(rawJd);
  return {
    responsibilities: lines.filter((line) => /负责|参与|建设|设计|开发/i.test(line)).slice(0, 8),
    requiredSkills: lines.filter((line) => /熟悉|掌握|经验|能力|要求/i.test(line)).slice(0, 8),
    bonusSkills: lines.filter((line) => /加分|优先|bonus/i.test(line)).slice(0, 6),
    riskPoints: lines.filter((line) => /高并发|分布式|稳定性|性能|复杂/i.test(line)).slice(0, 6),
    interviewFocus: ["项目深度", "基础知识", "系统设计", "稳定性"],
  };
}

function buildQuestion(role: string | null | undefined, mode: string, order: number, difficulty = "medium") {
  const target = role || "目标岗位";
  const questions =
    difficulty === "hard"
      ? [
          `请用 3 分钟介绍一个最能证明你达到高级/高薪${target}要求的项目，重点讲清业务影响、架构取舍和个人决策。`,
          "这个项目里最复杂的问题是什么？如果规模扩大 10 倍，你会如何重新设计？",
          "线上 P99 延迟升高且错误率抖动时，你会如何从指标、链路、依赖和发布变更排查？",
          "请讲一次你做过的系统性优化，如何证明收益、控制风险，并推动团队采用？",
          "如果入职后负责一个核心模块的稳定性和演进路线，你前 30 天会怎么判断优先级？",
        ]
      : difficulty === "easy"
        ? [
            `请用 2 分钟介绍一个最能体现你${target}基础能力的项目。`,
            "这个项目里你具体负责了什么？遇到的问题是怎么解决的？",
            "如果接口变慢，你会先检查哪些基础指标？",
            "请讲一个你学会并用到项目里的技术点。",
            "你为什么匹配这个岗位？还有哪些地方需要补强？",
          ]
        : [
            `请用 2 分钟介绍一个最能体现你${target}能力的项目。`,
            "这个项目里最难的技术问题是什么？你如何定位和解决？",
            "如果线上出现 P99 延迟升高，你会如何排查？",
            "请讲一个你做过的性能优化，如何验证收益？",
            "你为什么匹配这个岗位？入职后前 30 天会怎么开展工作？",
          ];
  if (mode === "system_design") {
    questions[order - 1] = order === 1
      ? difficulty === "hard"
        ? "请设计一个千万级短链接系统，说明容量估算、热点、缓存一致性、多地域容灾和降级方案。"
        : "请设计一个短链接系统，说明读写路径和高可用方案。"
      : questions[order - 1];
  }
  return questions[order - 1] ?? questions[0];
}

function inferInterviewDifficulty(seniority?: string | null, salaryK?: number | null, explicit?: string | null) {
  if (explicit === "easy" || explicit === "medium" || explicit === "hard") {
    return explicit;
  }
  const salary = salaryK ?? 0;
  if (seniority === "staff" || seniority === "senior" || salary >= 35) {
    return "hard";
  }
  if (seniority === "mid" || salary >= 20) {
    return "medium";
  }
  return "easy";
}

function buildDifficultyContext(seniority?: string | null, salaryK?: number | null, difficulty = "medium") {
  const labels: Record<string, string> = {
    junior: "初级工程师",
    mid: "中级工程师",
    senior: "高级工程师",
    staff: "资深/专家",
  };

  return {
    seniority: seniority ?? "mid",
    seniorityLabel: labels[seniority ?? "mid"] ?? "中级工程师",
    salaryK: salaryK ?? 0,
    difficulty,
    difficultyLabel: difficulty === "hard" ? "高难" : difficulty === "easy" ? "基础" : "中等",
  };
}

function scoreAnswer(answer: string) {
  const base = Math.min(92, Math.max(55, 55 + Math.floor(answer.length / 16)));
  return {
    feedback: answer.length > 120 ? "回答信息量不错，继续补充指标和取舍会更强。" : "回答偏短，建议补充背景、方案、结果和复盘。",
    betterAnswer: "建议按 STAR 或 背景-问题-方案-结果-复盘 的结构重答，并加入量化指标。",
    score: {
      accuracy: base,
      structure: Math.min(95, base + 3),
      depth: Math.max(50, base - 5),
      jobRelevance: base,
      projectConnection: Math.max(50, base - 3),
      expressionClarity: Math.min(95, base + 2),
    },
  };
}

function averageScore(scores: Array<Record<string, number>>) {
  const values = scores.flatMap((score) => Object.values(score)).filter((value) => Number.isFinite(value));
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 70;
}

function createLabTemplate(type: string, roleDirection?: string | null) {
  const role = roleDirection?.trim() || "目标岗位";

  if (type === "coding") {
    return {
      title: `${role} 代码面试练习`,
      prompt: "实现 LRU Cache：支持 get/put，平均时间复杂度 O(1)。提交时说明数据结构、边界条件和复杂度。",
      starterCode: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n\n  get(key) {\n    // TODO\n  }\n\n  put(key, value) {\n    // TODO\n  }\n}\n`,
    };
  }

  if (type === "system_design") {
    return {
      title: `${role} 系统设计白板`,
      prompt: "设计一个面试题/八股复习系统。请画出用户、API、题库、模拟面试、复盘、复习调度的核心链路，并说明瓶颈与扩展方案。",
    };
  }

  return {
    title: `${role} 同伴 mock 脚本`,
    prompt: "和同伴进行 30 分钟 mock：5 分钟自我介绍，15 分钟项目深挖，5 分钟八股追问，5 分钟反向提问。结束后互相给出一个优点、一个最大问题、三个下一步动作。",
  };
}

function reviewLabAnswer(input: { type: string; prompt: string; content: string }) {
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

function pickLearningPath(role?: string | null) {
  if (!role) {
    return learningPaths[0];
  }
  return learningPaths.find((path) => role.includes(path.role)) ?? learningPaths[0];
}

function nonEmptyLines(text: string) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function extractExperienceMeta(text: string) {
  const meta = {
    companyName: "",
    roleName: "",
    level: null as string | null,
    location: null as string | null,
    interviewDate: null as string | null,
  };
  const lines = nonEmptyLines(text);
  const knownCompany = ["阿里", "腾讯", "百度", "美团", "字节", "京东", "华为"].find((name) => text.includes(name));

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(/[：:]/);
    const key = rawKey?.trim();
    const value = rest.join(":").trim();
    if (!key || !value) {
      continue;
    }

    if (/公司|厂|组织|团队/.test(key)) {
      meta.companyName ||= value;
    } else if (/岗位|职位|方向|role/i.test(key)) {
      meta.roleName ||= value;
    } else if (/级别|职级|level/i.test(key)) {
      meta.level ||= value;
    } else if (/地点|城市|location/i.test(key)) {
      meta.location ||= value;
    } else if (/日期|时间|面试日|date/i.test(key)) {
      meta.interviewDate ||= normalizeDateLike(value);
    }
  }

  if (!meta.companyName && knownCompany) {
    meta.companyName = knownCompany;
  }

  return meta;
}

function normalizeDateLike(value: string) {
  const match = value.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function extractQuestions(text: string) {
  const lines = nonEmptyLines(text).filter((line) => /[？?]$/.test(line) || /问|题|如何|为什么/.test(line));
  return lines.length ? lines.slice(0, 8) : ["请复盘这段面经里的关键问题。"];
}

function parseOptionalDate(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildReadiness(input: {
  jdMatchScore?: number;
  knowledgeTotal: number;
  masteredKnowledge: number;
  finishedSessions: number;
  todoReviews: number;
  totalReviews: number;
}) {
  const jd = input.jdMatchScore ?? 50;
  const coverage = input.knowledgeTotal ? Math.round((input.masteredKnowledge / input.knowledgeTotal) * 100) : 0;
  const mock = Math.min(100, input.finishedSessions * 25);
  const review = input.totalReviews
    ? Math.round(((input.totalReviews - input.todoReviews) / input.totalReviews) * 100)
    : input.todoReviews === 0
      ? 70
      : 0;

  return {
    jd,
    coverage,
    mock,
    review,
    overall: Math.round(jd * 0.3 + coverage * 0.3 + mock * 0.2 + review * 0.2),
  };
}

function buildRoundDistribution(reports: Array<{ rounds: Array<{ roundType: string }> }>) {
  const counts = new Map<string, number>();
  reports.forEach((report) => {
    report.rounds.forEach((round) => {
      counts.set(round.roundType, (counts.get(round.roundType) ?? 0) + 1);
    });
  });

  return [...counts.entries()].map(([roundType, count]) => ({ roundType, count }));
}

function buildHighFrequencyQuestions(reports: Array<{ rounds: Array<{ roundType: string; questionsJson: string }> }>) {
  const counts = new Map<string, { count: number; roundType: string }>();
  reports.forEach((report) => {
    report.rounds.forEach((round) => {
      safeJsonParse<string[]>(round.questionsJson, []).forEach((question) => {
        const cleanQuestion = question.trim();
        if (!cleanQuestion) {
          return;
        }
        const current = counts.get(cleanQuestion);
        counts.set(cleanQuestion, { count: (current?.count ?? 0) + 1, roundType: current?.roundType ?? round.roundType });
      });
    });
  });

  return [...counts.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, 10)
    .map(([question, meta]) => ({ question, count: meta.count, roundType: meta.roundType }));
}

function splitSourceChunks(content: string) {
  const paragraphs = content.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs.length ? paragraphs : [content.trim()]) {
    if ((buffer + "\n\n" + paragraph).length > 1200 && buffer) {
      chunks.push(buffer);
      buffer = paragraph;
    } else {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks.length ? chunks : [content.slice(0, 1200)];
}

function estimateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.length / 2));
}

function buildDeliveryMetrics(turns: Array<{ answer: string | null; answerDurationSec: number | null; expressionJson: string }>) {
  const answered = turns.filter((turn) => turn.answer?.trim());
  const durations = answered.map((turn) => turn.answerDurationSec).filter((value): value is number => typeof value === "number" && value > 0);
  const fillerCount = answered.reduce((sum, turn) => sum + ((turn.answer ?? "").match(/嗯|呃|然后|就是/g)?.length ?? 0), 0);
  const avgDurationSec = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;
  const structureHits = answered.filter((turn) => /背景|目标|方案|结果|复盘|首先|其次|最后|STAR/i.test(turn.answer ?? "")).length;

  return {
    avgDurationSec,
    fillerCount,
    structureRate: answered.length ? Math.round((structureHits / answered.length) * 100) : 0,
    answerCount: answered.length,
  };
}

function buildAgentFallbackOutput(input: {
  agentName: string;
  input: Record<string, unknown>;
  application: unknown;
  sources: Array<{
    id: number;
    title: string;
    sourceType: string;
    chunks?: Array<{ id: number; content: string }>;
  }>;
}) {
  const sourceSnippets = input.sources.flatMap((source) =>
    (source.chunks ?? []).slice(0, 2).map((chunk) => ({
      sourceId: source.id,
      chunkId: chunk.id,
      quote: chunk.content.slice(0, 120),
      reason: `来自${source.title}，用于支撑 ${input.agentName} 的输出。`,
    })),
  );
  const output = {
    title: `${input.agentName} 运行结果`,
    summary: input.sources.length
      ? `已基于 ${input.sources.length} 份来源生成一版可编辑草稿。`
      : "当前没有绑定来源，已生成一版基于输入的可编辑草稿。",
    recommendations: [
      "先确认目标岗位、级别和 JD 是否完整。",
      "把输出中的关键结论绑定到简历、JD 或面经来源。",
      "下一步完成一次模拟面试，并把低分点回流为复盘行动。",
    ],
    application: input.application,
    input: input.input,
  };

  return {
    output,
    evidence: sourceSnippets,
    steps: [
      "读取 Agent 配置和输入。",
      input.sources.length ? "加载并引用来源文档分块。" : "未发现来源文档，标记为 AI 推断草稿。",
      "生成统一 Agent 输出并写入运行日志。",
    ],
    usedFallback: true,
  };
}

function mapExperienceRoundType(roundType?: string | null) {
  const lower = (roundType ?? "").toLowerCase();
  if (lower.includes("hr")) {
    return "hr_round";
  }
  if (lower.includes("主管") || lower.includes("manager")) {
    return "manager_round";
  }
  if (lower.includes("系统") || lower.includes("system")) {
    return "system_design";
  }
  if (lower.includes("二") || lower.includes("2")) {
    return "second_round";
  }
  return "first_round";
}

function countTopics(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
}

function makeSourceKey(item: SeedQuestion) {
  const source = item.source ?? "0voice/interview_internal_reference";
  const digest = createHash("sha1").update(`${source}:${item.note ?? ""}:${item.question}`).digest("hex");
  return `${source}:${digest}`;
}

function serializeInterviewTurnLoose(turn: {
  id: number;
  sessionId: number;
  order: number;
  question: string;
  questionSource: string | null;
  answer: string | null;
  feedback: string | null;
  betterAnswer: string | null;
  transcriptSource: string;
  answerDurationSec: number | null;
  expressionJson: string;
  scoreJson: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    order: turn.order,
    question: turn.question,
    questionSource: turn.questionSource,
    answer: turn.answer,
    feedback: turn.feedback,
    betterAnswer: turn.betterAnswer,
    transcriptSource: turn.transcriptSource,
    answerDurationSec: turn.answerDurationSec,
    expression: safeJsonParse<Record<string, number | string>>(turn.expressionJson, {}),
    score: safeJsonParse<Record<string, number>>(turn.scoreJson, {}),
    createdAt: turn.createdAt.toISOString(),
    updatedAt: turn.updatedAt.toISOString(),
  };
}
