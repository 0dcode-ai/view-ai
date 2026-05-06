import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildPrimaryTurns,
  buildInterviewerContext,
  buildInterviewerPlan,
  markPrimaryAsked,
} from "@/lib/mock-interviewer";
import { findOrCreateCompany } from "@/lib/db-helpers";
import { prisma } from "@/lib/db";
import { serializeInterviewSession } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  resumeProfileId: z.number().int().positive().optional(),
  resumeText: z.string().min(20).optional(),
  jdText: z.string().optional(),
  targetRole: z.string().optional(),
  targetCompanyName: z.string().optional(),
  seniority: z.enum(["junior", "mid", "senior", "staff"]).default("mid"),
  durationMinutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]).default(20),
}).refine((input) => Boolean(input.resumeProfileId || input.resumeText?.trim()), {
  message: "必须提供简历文本或选择一份简历。",
  path: ["resumeText"],
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请贴入简历或选择一份简历。" }, { status: 400 });
  }

  const resume = parsed.data.resumeProfileId
    ? await prisma.resumeProfile.findUnique({ where: { id: parsed.data.resumeProfileId } })
    : null;
  if (parsed.data.resumeProfileId && !resume) {
    return NextResponse.json({ error: "简历不存在。" }, { status: 404 });
  }

  const resumeText = parsed.data.resumeText?.trim() || resume?.rawText || "";
  const company = await findOrCreateCompany(parsed.data.targetCompanyName);
  const context = buildInterviewerContext({
    resumeText,
    resumeProfile: resume
      ? {
          parsed: JSON.parse(resume.parsedJson || "{}"),
        }
      : null,
    jdText: parsed.data.jdText,
    targetRole: parsed.data.targetRole,
    seniority: parsed.data.seniority,
    durationMinutes: parsed.data.durationMinutes,
  });
  let plan = buildInterviewerPlan(context);
  const primaryTurns = buildPrimaryTurns(plan);
  if (!primaryTurns.length) {
    return NextResponse.json({ error: "简历信息不足，无法生成面试问题。" }, { status: 400 });
  }
  for (const turn of primaryTurns) {
    plan = markPrimaryAsked(plan, turn.topicId);
  }

  const session = await prisma.interviewSession.create({
    data: {
      mode: "mixed",
      roundType: "first_round",
      deliveryMode: "text",
      targetRole: context.targetRole,
      targetCompanyId: company?.id,
      resumeProfileId: resume?.id,
      status: "active",
      contextJson: JSON.stringify(context),
      configJson: JSON.stringify({
        sessionKind: "mock_interviewer",
        answerVisibility: "toggle",
        scoringTiming: "final_only",
        inputMode: "text",
      }),
      planJson: JSON.stringify(plan),
      expressionJson: JSON.stringify({ agentName: "mock-interviewer" }),
      turns: {
        create: primaryTurns.map((turn) => ({
          order: turn.order,
          question: turn.question,
          questionSource: turn.questionSource,
          turnType: turn.turnType,
          intent: turn.intent,
          idealAnswer: turn.idealAnswer,
        })),
      },
    },
    include: {
      company: true,
      jobTarget: { include: { company: true, resumeProfile: true } },
      resumeProfile: true,
      turns: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json({ session: serializeInterviewSession(session) }, { status: 201 });
}
