import { Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  AnswerInterviewInput,
  CreateExperienceInput,
  CreateKnowledgeInput,
  GenerateSprintInput,
  ParseExperienceInput,
  ParseJobTargetInput,
  ParseResumeInput,
  StartInterviewInput,
  StartLabInput,
  SubmitLabInput,
  UpdateKnowledgeProgressInput,
} from "@interview/shared";
import { PrismaService } from "./prisma.service";
import type { AuthUser } from "./auth/auth-user";
import {
  serializeExperienceReport,
  serializeInterviewSession,
  serializeJobTarget,
  serializeKnowledgeCard,
  serializeLabSession,
  serializeQuestionTemplate,
  serializeResumeProfile,
  serializeReviewCard,
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
const includeSession = {
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

@Injectable()
export class CoreService {
  constructor(private readonly prisma: PrismaService) {}

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
    const cards = await this.prisma.knowledgeCard.findMany({
      where: {
        userId: user.id,
        ...this.knowledgeWhere(query),
      },
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

    const mistakeCount = existing.mistakeCount + (input.mistakeDelta ?? 0);
    const reviewCount = input.markReviewed ? existing.reviewCount + 1 : existing.reviewCount;
    const card = await this.prisma.knowledgeCard.update({
      where: { id },
      data: {
        mastery: input.mastery,
        reviewCount,
        mistakeCount,
        lastReviewedAt: input.markReviewed ? new Date() : existing.lastReviewedAt,
        nextReviewAt: input.markReviewed
          ? nextReviewDate({ mastery: input.mastery, reviewCount, mistakeCount })
          : existing.nextReviewAt,
        priorityScore: priorityFromReview({
          priorityScore: existing.priorityScore,
          mastery: input.mastery,
          markReviewed: input.markReviewed,
          mistakeDelta: input.mistakeDelta,
        }),
      },
      include: includeKnowledge,
    });

    return { card: serializeKnowledgeCard(card) };
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
    const company = await this.findOrCreateCompany(input.companyName);
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
        resumeProfileId: input.resumeProfileId,
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
    const company = await this.findOrCreateCompany(input.targetCompanyName);
    const firstQuestion = buildQuestion(input.targetRole, input.mode, 1);
    const session = await this.prisma.interviewSession.create({
      data: {
        userId: user.id,
        mode: input.mode,
        roundType: input.roundType,
        deliveryMode: input.deliveryMode,
        targetRole: input.targetRole,
        targetCompanyId: company?.id,
        resumeProfileId: input.resumeProfileId,
        jobTargetId: input.jobTargetId,
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
    const nextTurn = shouldFinish
      ? null
      : await this.prisma.interviewTurn.create({
          data: {
            sessionId,
            order: openTurn.order + 1,
            question: buildQuestion(session.targetRole, session.mode, openTurn.order + 1),
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
      },
      include: includeSession,
    });

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
    const title = input.type === "coding" ? "编码练习" : input.type === "system_design" ? "系统设计练习" : "同伴模拟";
    const session = await this.prisma.labSession.create({
      data: {
        userId: user.id,
        type: input.type,
        roleDirection: input.roleDirection,
        title,
        prompt: `围绕${input.roleDirection || "目标岗位"}完成一次${title}。`,
        starterCode: input.type === "coding" ? "// 在这里写下你的思路和代码\n" : null,
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
        status: "submitted",
        feedbackJson: JSON.stringify({
          score: Math.min(95, Math.max(60, 60 + Math.floor(input.content.length / 80))),
          strengths: ["能完整提交练习内容"],
          gaps: ["继续补充复杂度、边界条件和项目场景"],
          nextAction: "把答案压缩成 2 分钟口述版本。",
        }),
      },
    });
    return { labSession: serializeLabSession(session) };
  }

  async listExperiences(user: AuthUser, query: Query) {
    await this.ensureUser(user);
    const reports = await this.prisma.experienceReport.findMany({
      where: {
        userId: user.id,
        ...(query.company ? { company: { is: { name: { contains: query.company } } } } : {}),
      },
      include: includeExperience,
      orderBy: { updatedAt: "desc" },
      take: Number(query.take ?? 100),
    });
    return { experiences: reports.map(serializeExperienceReport) };
  }

  parseExperience(input: ParseExperienceInput) {
    return {
      draft: {
        companyName: input.companyName || guessCompany(input.rawText),
        roleName: input.roleName || "后端工程师",
        level: null,
        location: null,
        interviewDate: null,
        result: "unknown",
        difficulty: "medium",
        sourceType: "manual",
        confidence: "medium",
        verified: false,
        durationMinutes: null,
        rawText: input.rawText,
        summary: input.rawText.slice(0, 160),
        tags: normalizeTags(["面经", input.companyName || guessCompany(input.rawText)]),
        rounds: [
          {
            order: 1,
            roundType: "technical",
            durationMinutes: null,
            interviewerStyle: null,
            focusAreas: ["项目", "基础", "系统设计"],
            questions: extractQuestions(input.rawText),
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
    const topic = await this.findOrCreateTopic("面经复盘");
    const questions = report.rounds.flatMap((round) => safeJsonParse<string[]>(round.questionsJson, []));
    const created = await Promise.all(
      questions.slice(0, 5).map((question) =>
        this.prisma.knowledgeCard.create({
          data: {
            userId: user.id,
            companyId: report.companyId,
            topicId: topic?.id,
            question,
            answer: "根据面经整理答案，并补充自己的项目经历。",
            questionType: "面经",
            abilityDimension: "项目深度",
            tagsJson: tagsToJson(["面经", report.company?.name ?? "", report.roleName]),
            source: "面经生成",
            priorityScore: 82,
          },
          include: includeKnowledge,
        }),
      ),
    );
    return { created: created.map(serializeKnowledgeCard) };
  }

  async startInterviewFromExperience(user: AuthUser, reportId: number) {
    const report = await this.prisma.experienceReport.findFirst({ where: { id: reportId, userId: user.id }, include: includeExperience });
    if (!report) {
      throw new NotFoundException("面经不存在。");
    }
    return this.startInterview(user, {
      mode: "mixed",
      roundType: "first_round",
      deliveryMode: "text",
      targetRole: report.roleName,
    });
  }

  async createDailyTasksFromExperience(user: AuthUser, reportId: number) {
    const report = await this.prisma.experienceReport.findFirst({ where: { id: reportId, userId: user.id } });
    if (!report) {
      throw new NotFoundException("面经不存在。");
    }
    return this.generateSprint(user, { roleName: report.roleName, days: 3 });
  }

  async companyIntel(user: AuthUser, companyId: number) {
    await this.ensureUser(user);
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException("公司不存在。");
    }
    const [reports, knowledgeCards, templates] = await Promise.all([
      this.prisma.experienceReport.findMany({ where: { userId: user.id, companyId }, include: includeExperience, take: 20 }),
      this.prisma.knowledgeCard.findMany({ where: { userId: user.id, companyId }, include: includeKnowledge, take: 20 }),
      this.prisma.questionTemplate.findMany({ where: { companyId }, include: includeQuestionTemplate, take: 20 }),
    ]);
    const hotTopics = countTopics([...knowledgeCards.map((card) => card.abilityDimension), ...templates.map((template) => template.abilityDimension)]);
    return {
      company: { id: company.id, name: company.name },
      hotTopics,
      reports: reports.map(serializeExperienceReport),
      knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
    };
  }

  async companyPrep(user: AuthUser, companyId: number) {
    await this.ensureUser(user);
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException("公司不存在。");
    }
    const [jobTargets, knowledgeCards, sessions, reviewCards, sprintPlans] = await Promise.all([
      this.prisma.jobTarget.findMany({ where: { userId: user.id, companyId }, include: includeJobTarget }),
      this.prisma.knowledgeCard.findMany({ where: { userId: user.id, companyId }, include: includeKnowledge }),
      this.prisma.interviewSession.findMany({ where: { userId: user.id, targetCompanyId: companyId }, include: includeSession }),
      this.prisma.reviewCard.findMany({ where: { userId: user.id, session: { targetCompanyId: companyId } }, include: includeReview }),
      this.prisma.sprintPlan.findMany({ where: { userId: user.id, companyId }, include: includeSprint }),
    ]);
    return {
      company: { id: company.id, name: company.name },
      jobTargets: jobTargets.map(serializeJobTarget),
      knowledgeCards: knowledgeCards.map(serializeKnowledgeCard),
      sessions: sessions.map(serializeInterviewSession),
      reviewCards: reviewCards.map(serializeReviewCard),
      sprintPlans: sprintPlans.map(serializeSprintPlan),
    };
  }

  learningPath(role?: string) {
    const targetRole = role?.trim() || "后端工程师";
    return {
      role: targetRole,
      headline: `${targetRole} 移动端备战路径`,
      stages: [
        { title: "基础补齐", goal: "补齐高频八股和薄弱专题", topics: ["MySQL", "Redis", "网络"], drill: "每天 20 分钟题卡复习" },
        { title: "项目表达", goal: "把项目讲成可追问的故事线", topics: ["项目深度", "量化结果"], drill: "录一次 2 分钟项目介绍" },
        { title: "模拟面试", goal: "训练结构化回答和追问承压", topics: ["一面", "二面", "HR 面"], drill: "完成一轮 5 题模拟" },
      ],
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

function buildQuestion(role: string | null | undefined, mode: string, order: number) {
  const target = role || "目标岗位";
  const questions = [
    `请用 2 分钟介绍一个最能体现你${target}能力的项目。`,
    "这个项目里最难的技术问题是什么？你如何定位和解决？",
    "如果线上出现 P99 延迟升高，你会如何排查？",
    "请讲一个你做过的性能优化，如何验证收益？",
    "你为什么匹配这个岗位？入职后前 30 天会怎么开展工作？",
  ];
  if (mode === "system_design") {
    questions[order - 1] = order === 1 ? "请设计一个短链接系统，说明读写路径和高可用方案。" : questions[order - 1];
  }
  return questions[order - 1] ?? questions[0];
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

function nonEmptyLines(text: string) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function guessCompany(text: string) {
  return ["阿里", "腾讯", "百度", "美团", "字节", "京东", "华为"].find((name) => text.includes(name)) || "";
}

function extractQuestions(text: string) {
  const lines = nonEmptyLines(text).filter((line) => /[？?]$/.test(line) || /问|题|如何|为什么/.test(line));
  return lines.length ? lines.slice(0, 8) : ["请复盘这段面经里的关键问题。"];
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
