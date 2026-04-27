export const interviewModes = ["resume", "company", "mixed"] as const;
export const roundTypes = ["first_round", "second_round", "manager_round", "hr_round", "system_design"] as const;

export type InterviewMode = (typeof interviewModes)[number];
export type RoundType = (typeof roundTypes)[number];

export const interviewModeLabels: Record<InterviewMode, string> = {
  resume: "简历深挖",
  company: "公司八股",
  mixed: "混合模拟",
};

export const roundTypeLabels: Record<RoundType, string> = {
  first_round: "一面",
  second_round: "二面",
  manager_round: "主管面",
  hr_round: "HR 面",
  system_design: "系统设计面",
};

export function isInterviewMode(value: string): value is InterviewMode {
  return interviewModes.includes(value as InterviewMode);
}

export function isRoundType(value: string): value is RoundType {
  return roundTypes.includes(value as RoundType);
}

export function questionMix(mode: InterviewMode): Record<"resume" | "company" | "general", number> {
  if (mode === "resume") {
    return { resume: 80, company: 10, general: 10 };
  }

  if (mode === "company") {
    return { resume: 10, company: 80, general: 10 };
  }

  return { resume: 40, company: 40, general: 20 };
}

export function roundFocus(roundType: RoundType): string {
  switch (roundType) {
    case "first_round":
      return "基础概念、常见八股、简历真实性";
    case "second_round":
      return "项目深挖、技术原理、复杂问题处理";
    case "manager_round":
      return "技术决策、协作推动、业务结果";
    case "hr_round":
      return "求职动机、稳定性、沟通风格、价值观匹配";
    case "system_design":
      return "架构拆解、容量估算、数据流、可靠性和取舍";
  }
}
