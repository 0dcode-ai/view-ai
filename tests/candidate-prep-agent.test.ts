import { describe, expect, it } from "vitest";
import { runCandidatePrepAgent } from "@/lib/candidate-prep-agent";

describe("runCandidatePrepAgent fallback with github context", () => {
  it("incorporates github context into fallback prep output", async () => {
    const payload = await runCandidatePrepAgent({
      resume: {
        rawText: "做过一个 AI coding assistant 项目，负责 prompt、工具调用和结果回流。",
        parsed: {
          summary: "做过 AI coding assistant 项目。",
          skills: ["TypeScript", "LLM", "Tool Calling"],
          experiences: ["负责接入模型、工具调用和日志分析。"],
          projects: ["AI Coding Assistant"],
          followUpQuestions: ["你怎么做结构化输出？"],
        },
      },
      jobTarget: {
        roleName: "AI 应用工程师",
        parsed: {
          responsibilities: ["搭建 AI 工作流"],
          requiredSkills: ["LLM", "Prompt", "RAG"],
          bonusSkills: ["MCP"],
          riskPoints: ["需要落地经验"],
          interviewFocus: ["项目深挖"],
        },
        match: {
          matchScore: 78,
          strengths: ["做过 AI 应用项目"],
          gaps: ["缺少系统化的开源竞品表达"],
          projectTalkTracks: ["重点讲工具调用链路"],
        },
      },
      githubContext: {
        summaries: ["最近看了几个 coding agent 项目，重点在工具调度和工作流编排。"],
        topSignals: ["Coding Agents 方向热度集中，适合补一段你对同类方案的判断。"],
        suggestedReferences: ["可以结合 GitHub 雷达里的 coding agent 来源，补一段对开源实现的理解。"],
      },
    });

    expect(payload.prep.jobAlignment.join(" ")).toContain("开源参考");
    expect(payload.prep.followUpQuestions.join(" ")).toContain("GitHub");
    expect(payload.prep.projectTalkTracks[0]?.proofPoints.join(" ")).toContain("开源实现");
  });
});
