import { ApiClient } from "@interview/shared";

const externalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const migratedResources = new Set(
  (process.env.NEXT_PUBLIC_API_MIGRATED_RESOURCES || "knowledge,resumes,job-targets,interviews,interviewer-sessions,reviews,sprints,daily,experiences,companies,labs,learning-paths,applications,resume-versions,sources,agents")
    .split(",")
    .map((resource) => resource.trim())
    .filter(Boolean),
);

export const useExternalApi = Boolean(externalBaseUrl);

const externalClient = new ApiClient({
  baseUrl: externalBaseUrl,
});

export async function appRequestJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!useExternalApi || !shouldProxyToExternalApi(path)) {
    return localRequestJson<T>(path, init);
  }

  return externalClient.request<T>(toExternalPath(path), init);
}

function shouldProxyToExternalApi(path: string) {
  return (
    (migratedResources.has("knowledge") && isKnowledgeCrudPath(path)) ||
    (migratedResources.has("resumes") && isResumeCrudPath(path)) ||
    (migratedResources.has("job-targets") && isJobTargetPath(path)) ||
    (migratedResources.has("interviews") && isInterviewPath(path)) ||
    (migratedResources.has("interviewer-sessions") && isInterviewerSessionPath(path)) ||
    (migratedResources.has("reviews") && isReviewPath(path)) ||
    (migratedResources.has("sprints") && isSprintPath(path)) ||
    (migratedResources.has("daily") && isDailyPath(path)) ||
    (migratedResources.has("experiences") && isExperiencePath(path)) ||
    (migratedResources.has("companies") && isCompanyPath(path)) ||
    (migratedResources.has("labs") && isLabPath(path)) ||
    (migratedResources.has("learning-paths") && isLearningPath(path)) ||
    (migratedResources.has("applications") && isApplicationPath(path)) ||
    (migratedResources.has("resume-versions") && isResumeVersionPath(path)) ||
    (migratedResources.has("sources") && isSourcePath(path)) ||
    (migratedResources.has("agents") && isAgentPath(path))
  );
}

function isKnowledgeCrudPath(path: string) {
  const pathname = path.split("?")[0] ?? "";

  if (pathname === "/api/knowledge") {
    return true;
  }

  return /^\/api\/knowledge\/\d+(\/progress)?$/.test(pathname);
}

function isResumeCrudPath(path: string) {
  const pathname = path.split("?")[0] ?? "";

  if (pathname === "/api/resumes" || pathname === "/api/resume/parse") {
    return true;
  }

  return /^\/api\/resumes\/\d+$/.test(pathname);
}

function isJobTargetPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  return pathname === "/api/job-targets" || pathname === "/api/job-targets/parse";
}

function isInterviewPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  return (
    pathname === "/api/interviews" ||
    pathname === "/api/interviews/start" ||
    pathname === "/api/interviews/answer" ||
    pathname === "/api/interviews/finish"
  );
}

function isInterviewerSessionPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  return pathname === "/api/interviewer-sessions/start" || /^\/api\/interviewer-sessions\/\d+\/(answer|finish)$/.test(pathname);
}

function isReviewPath(path: string) {
  const pathname = path.split("?")[0] ?? "";

  if (pathname === "/api/reviews") {
    return true;
  }

  return /^\/api\/reviews\/\d+$/.test(pathname);
}

function isSprintPath(path: string) {
  const pathname = path.split("?")[0] ?? "";

  if (pathname === "/api/sprints" || pathname === "/api/sprints/generate") {
    return true;
  }

  return /^\/api\/sprint-tasks\/\d+$/.test(pathname);
}

function isDailyPath(path: string) {
  return (path.split("?")[0] ?? "") === "/api/daily";
}

function isExperiencePath(path: string) {
  const pathname = path.split("?")[0] ?? "";

  if (pathname === "/api/experiences" || pathname === "/api/experiences/parse") {
    return true;
  }

  return /^\/api\/experiences\/\d+\/(generate-cards|start-interview|create-daily-tasks)$/.test(pathname);
}

function isCompanyPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  return /^\/api\/companies\/\d+\/(intel|prep)$/.test(pathname);
}

function isLabPath(path: string) {
  const pathname = path.split("?")[0] ?? "";

  if (pathname === "/api/labs" || pathname === "/api/labs/start" || pathname === "/api/labs/submit") {
    return true;
  }

  return /^\/api\/labs\/\d+\/submit$/.test(pathname);
}

function isLearningPath(path: string) {
  return (path.split("?")[0] ?? "") === "/api/learning-paths";
}

function isApplicationPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  if (pathname === "/api/applications") {
    return true;
  }
  return /^\/api\/applications\/\d+(\/(match|resume-versions))?$/.test(pathname);
}

function isResumeVersionPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  return /^\/api\/resume-versions\/\d+(\/(generate-bullet|auto-select))?$/.test(pathname);
}

function isSourcePath(path: string) {
  return (path.split("?")[0] ?? "") === "/api/sources";
}

function isAgentPath(path: string) {
  const pathname = path.split("?")[0] ?? "";
  return pathname === "/api/agents" || pathname === "/api/agents/runs" || /^\/api\/agents\/[^/]+\/run$/.test(pathname);
}

function toExternalPath(path: string) {
  const [pathname, query = ""] = path.split("?");
  const externalPathname = pathname === "/api/resume/parse" ? "/api/resumes/parse" : pathname;
  const normalized = externalPathname.replace(/^\/api/, "");
  const suffix = normalized === "" ? "/" : normalized;
  return `${suffix}${query ? `?${query}` : ""}`;
}

async function localRequestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "请求失败");
  }

  return payload as T;
}
