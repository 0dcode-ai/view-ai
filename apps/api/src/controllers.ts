import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from "@nestjs/common";
import {
  answerInterviewSchema,
  answerInterviewBySessionSchema,
  agentRunSchema,
  createApplicationSchema,
  createAgentRunLogSchema,
  createExperienceSchema,
  createKnowledgeSchema,
  createSourceDocumentSchema,
  generateSprintSchema,
  finishInterviewSchema,
  parseExperienceSchema,
  parseJobTargetSchema,
  parseResumeSchema,
  startInterviewSchema,
  startLabSchema,
  submitLabBySessionSchema,
  submitLabSchema,
  updateAgentConfigSchema,
  updateApplicationSchema,
  updateKnowledgeSchema,
  updateKnowledgeProgressSchema,
  updateReviewSchema,
  updateResumeSchema,
} from "@interview/shared";
import { CurrentUser } from "./auth/current-user.decorator";
import type { AuthUser } from "./auth/auth-user";
import { Public } from "./auth/public.decorator";
import { CoreService } from "./core.service";
import { parseBody } from "./utils/zod";

@Controller("health")
class HealthController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Public()
  @Get()
  health() {
    return this.core.health();
  }
}

@Controller("daily")
class DailyController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  daily(@CurrentUser() user: AuthUser) {
    return this.core.daily(user);
  }
}

@Controller("knowledge")
class KnowledgeController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.core.listKnowledge(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.createKnowledge(user, parseBody(createKnowledgeSchema, body));
  }

  @Patch(":id/progress")
  progress(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.updateKnowledgeProgress(user, Number(id), parseBody(updateKnowledgeProgressSchema, body));
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.updateKnowledge(user, Number(id), parseBody(updateKnowledgeSchema, body));
  }

  @Delete(":id")
  delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.deleteKnowledge(user, Number(id));
  }
}

@Controller("question-templates")
class QuestionTemplatesController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    return this.core.listQuestionTemplates(query);
  }

  @Post("import")
  import() {
    return this.core.importQuestionTemplates();
  }

  @Post(":id/adopt")
  adopt(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.adoptQuestionTemplate(user, Number(id));
  }
}

@Controller("resumes")
class ResumesController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.core.listResumes(user);
  }

  @Post("parse")
  parse(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.parseResume(user, parseBody(parseResumeSchema, body));
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.updateResume(user, Number(id), parseBody(updateResumeSchema, body));
  }

  @Delete(":id")
  delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.deleteResume(user, Number(id));
  }
}

@Controller("job-targets")
class JobTargetsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.core.listJobTargets(user);
  }

  @Post("parse")
  parse(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.parseJobTarget(user, parseBody(parseJobTargetSchema, body));
  }
}

@Controller("applications")
class ApplicationsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.core.listApplications(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.createApplication(user, parseBody(createApplicationSchema, body));
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.updateApplication(user, Number(id), parseBody(updateApplicationSchema, body));
  }
}

@Controller("sources")
class SourcesController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.core.listSources(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.createSource(user, parseBody(createSourceDocumentSchema, body));
  }
}

@Controller("interviews")
class InterviewsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.core.listInterviews(user);
  }

  @Post("start")
  start(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.startInterview(user, parseBody(startInterviewSchema, body));
  }

  @Post(":id/answer")
  answer(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.answerInterview(user, Number(id), parseBody(answerInterviewSchema, body));
  }

  @Post("answer")
  answerBySession(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.answerInterviewBySession(user, parseBody(answerInterviewBySessionSchema, body));
  }

  @Post(":id/finish")
  finish(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.finishInterview(user, Number(id));
  }

  @Post("finish")
  finishBySession(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.finishInterviewBySession(user, parseBody(finishInterviewSchema, body));
  }

  @Post("transcribe")
  transcribe(@Body() body: { text?: string }) {
    return this.core.transcribeAnswer(body);
  }
}

@Controller("reviews")
class ReviewsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.core.listReviews(user, query);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.updateReview(user, Number(id), parseBody(updateReviewSchema, body));
  }
}

@Controller("sprints")
class SprintsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.core.listSprints(user);
  }

  @Post("generate")
  generate(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.generateSprint(user, parseBody(generateSprintSchema, body));
  }
}

@Controller("sprint-tasks")
class SprintTasksController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: { status?: "todo" | "doing" | "done" }) {
    return this.core.updateSprintTask(user, Number(id), body.status ?? "todo");
  }
}

@Controller("labs")
class LabsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.core.listLabs(user);
  }

  @Post("start")
  start(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.startLab(user, parseBody(startLabSchema, body));
  }

  @Post(":id/submit")
  submit(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.core.submitLab(user, Number(id), parseBody(submitLabSchema, body));
  }

  @Post("submit")
  submitBySession(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parseBody(submitLabBySessionSchema, body);
    return this.core.submitLab(user, input.sessionId, { content: input.content });
  }
}

@Controller("experiences")
class ExperiencesController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.core.listExperiences(user, query);
  }

  @Post("parse")
  parse(@Body() body: unknown) {
    return this.core.parseExperience(parseBody(parseExperienceSchema, body));
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.createExperience(user, parseBody(createExperienceSchema, body));
  }

  @Post(":id/generate-cards")
  generateCards(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.generateCardsFromExperience(user, Number(id));
  }

  @Post(":id/start-interview")
  startInterview(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.startInterviewFromExperience(user, Number(id));
  }

  @Post(":id/create-daily-tasks")
  createDailyTasks(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.createDailyTasksFromExperience(user, Number(id));
  }
}

@Controller("companies")
class CompaniesController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get(":id/intel")
  intel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.companyIntel(user, Number(id));
  }

  @Get(":id/prep")
  prep(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.core.companyPrep(user, Number(id));
  }
}

@Controller("learning-paths")
class LearningPathsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  list(@Query("role") role?: string) {
    return this.core.learningPath(role);
  }
}

@Controller("agents")
class AgentsController {
  constructor(@Inject(CoreService) private readonly core: CoreService) {}

  @Get()
  configs(@CurrentUser() user: AuthUser) {
    return this.core.listAgentConfigs(user);
  }

  @Patch(":agentName")
  updateConfig(@CurrentUser() user: AuthUser, @Param("agentName") agentName: string, @Body() body: unknown) {
    return this.core.updateAgentConfig(user, agentName, parseBody(updateAgentConfigSchema, body));
  }

  @Get("runs")
  runs(@CurrentUser() user: AuthUser, @Query() query: Record<string, string | undefined>) {
    return this.core.listAgentRunLogs(user, query);
  }

  @Post("runs")
  createRun(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.core.createAgentRunLog(user, parseBody(createAgentRunLogSchema, body));
  }

  @Post(":agentName/run")
  run(@CurrentUser() user: AuthUser, @Param("agentName") agentName: string, @Body() body: unknown) {
    return this.core.runAgent(user, agentName, parseBody(agentRunSchema, body));
  }
}

export const ApiControllers = [
  HealthController,
  DailyController,
  KnowledgeController,
  QuestionTemplatesController,
  ResumesController,
  JobTargetsController,
  ApplicationsController,
  SourcesController,
  InterviewsController,
  ReviewsController,
  SprintsController,
  SprintTasksController,
  LabsController,
  ExperiencesController,
  CompaniesController,
  LearningPathsController,
  AgentsController,
];
