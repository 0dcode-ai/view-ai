import type { Prisma } from "@prisma/client";
import { normalizeTags, tagsFromJson, tagsToJson } from "@/lib/tags";

export type StartupIdeaInput = {
  title: string;
  oneLiner?: string | null;
  problem?: string | null;
  targetUsers?: string | null;
  solution?: string | null;
  aiAgentFlow?: string | null;
  dataSignals?: string | null;
  monetization?: string | null;
  validationPlan?: string | null;
  risks?: string | null;
  tags?: string[] | string | null;
  status?: string | null;
};

export type StartupIdeaRecord = Prisma.StartupIdeaGetPayload<Record<string, never>>;

export function startupIdeaDataFromInput(input: StartupIdeaInput) {
  return {
    title: input.title.trim(),
    oneLiner: input.oneLiner?.trim() ?? "",
    problem: input.problem?.trim() ?? "",
    targetUsers: input.targetUsers?.trim() ?? "",
    solution: input.solution?.trim() ?? "",
    aiAgentFlow: input.aiAgentFlow?.trim() ?? "",
    dataSignals: input.dataSignals?.trim() ?? "",
    monetization: input.monetization?.trim() ?? "",
    validationPlan: input.validationPlan?.trim() ?? "",
    risks: input.risks?.trim() ?? "",
    tagsJson: tagsToJson(normalizeTags(input.tags)),
    status: input.status?.trim() || "idea",
  };
}

export function serializeStartupIdea(idea: StartupIdeaRecord) {
  return {
    id: idea.id,
    title: idea.title,
    oneLiner: idea.oneLiner,
    problem: idea.problem,
    targetUsers: idea.targetUsers,
    solution: idea.solution,
    aiAgentFlow: idea.aiAgentFlow,
    dataSignals: idea.dataSignals,
    monetization: idea.monetization,
    validationPlan: idea.validationPlan,
    risks: idea.risks,
    tags: tagsFromJson(idea.tagsJson),
    status: idea.status,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}
