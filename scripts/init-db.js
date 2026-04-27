const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const tableSql = [
  `CREATE TABLE IF NOT EXISTS "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "aliasesJson" TEXT NOT NULL DEFAULT '[]',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Topic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "KnowledgeCard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "companyId" INTEGER,
    "topicId" INTEGER,
    "roleDirection" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'technical',
    "abilityDimension" TEXT NOT NULL DEFAULT '基础知识',
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "mistakeCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" DATETIME,
    "nextReviewAt" DATETIME,
    "priorityScore" INTEGER NOT NULL DEFAULT 50,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeCard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeCard_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ResumeProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT '我的简历',
    "rawText" TEXT NOT NULL,
    "parsedJson" TEXT NOT NULL DEFAULT '{}',
    "followUpQuestionsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "JobTarget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER,
    "resumeProfileId" INTEGER,
    "roleName" TEXT NOT NULL,
    "rawJd" TEXT NOT NULL,
    "parsedJson" TEXT NOT NULL DEFAULT '{}',
    "matchJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JobTarget_resumeProfileId_fkey" FOREIGN KEY ("resumeProfileId") REFERENCES "ResumeProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "InterviewSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mode" TEXT NOT NULL,
    "roundType" TEXT NOT NULL DEFAULT 'first_round',
    "deliveryMode" TEXT NOT NULL DEFAULT 'text',
    "targetRole" TEXT,
    "targetCompanyId" INTEGER,
    "resumeProfileId" INTEGER,
    "jobTargetId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "scoreJson" TEXT NOT NULL DEFAULT '{}',
    "expressionJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewSession_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InterviewSession_resumeProfileId_fkey" FOREIGN KEY ("resumeProfileId") REFERENCES "ResumeProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InterviewSession_jobTargetId_fkey" FOREIGN KEY ("jobTargetId") REFERENCES "JobTarget" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "InterviewTurn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "questionSource" TEXT,
    "answer" TEXT,
    "feedback" TEXT,
    "betterAnswer" TEXT,
    "transcriptSource" TEXT NOT NULL DEFAULT 'text',
    "answerDurationSec" INTEGER,
    "audioMetaJson" TEXT NOT NULL DEFAULT '{}',
    "expressionJson" TEXT NOT NULL DEFAULT '{}',
    "scoreJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ReviewCard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER,
    "knowledgeCardId" INTEGER,
    "title" TEXT NOT NULL,
    "weakness" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "dueAt" DATETIME,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewCard_knowledgeCardId_fkey" FOREIGN KEY ("knowledgeCardId") REFERENCES "KnowledgeCard" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReviewCard_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "SprintPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER,
    "jobTargetId" INTEGER,
    "resumeProfileId" INTEGER,
    "title" TEXT NOT NULL,
    "targetRole" TEXT,
    "interviewDate" DATETIME,
    "days" INTEGER NOT NULL DEFAULT 7,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SprintPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SprintPlan_jobTargetId_fkey" FOREIGN KEY ("jobTargetId") REFERENCES "JobTarget" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SprintPlan_resumeProfileId_fkey" FOREIGN KEY ("resumeProfileId") REFERENCES "ResumeProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "SprintTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planId" INTEGER NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SprintTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SprintPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "LabSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "roleDirection" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "starterCode" TEXT,
    "content" TEXT,
    "feedbackJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "ExperienceReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER,
    "roleName" TEXT NOT NULL,
    "level" TEXT,
    "location" TEXT,
    "interviewDate" DATETIME,
    "result" TEXT NOT NULL DEFAULT 'unknown',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "sourceType" TEXT NOT NULL DEFAULT 'self',
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "durationMinutes" INTEGER,
    "rawText" TEXT NOT NULL,
    "summary" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExperienceReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "ExperienceRound" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reportId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "roundType" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "interviewerStyle" TEXT,
    "focusAreasJson" TEXT NOT NULL DEFAULT '[]',
    "questionsJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    CONSTRAINT "ExperienceRound_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ExperienceReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
];

const columnSql = {
  KnowledgeCard: [
    ["questionType", `"questionType" TEXT NOT NULL DEFAULT 'technical'`],
    ["abilityDimension", `"abilityDimension" TEXT NOT NULL DEFAULT '基础知识'`],
    ["mastery", `"mastery" INTEGER NOT NULL DEFAULT 0`],
    ["reviewCount", `"reviewCount" INTEGER NOT NULL DEFAULT 0`],
    ["mistakeCount", `"mistakeCount" INTEGER NOT NULL DEFAULT 0`],
    ["lastReviewedAt", `"lastReviewedAt" DATETIME`],
    ["nextReviewAt", `"nextReviewAt" DATETIME`],
    ["priorityScore", `"priorityScore" INTEGER NOT NULL DEFAULT 50`],
  ],
  InterviewSession: [
    ["roundType", `"roundType" TEXT NOT NULL DEFAULT 'first_round'`],
    ["deliveryMode", `"deliveryMode" TEXT NOT NULL DEFAULT 'text'`],
    ["jobTargetId", `"jobTargetId" INTEGER`],
    ["expressionJson", `"expressionJson" TEXT NOT NULL DEFAULT '{}'`],
  ],
  InterviewTurn: [
    ["betterAnswer", `"betterAnswer" TEXT`],
    ["transcriptSource", `"transcriptSource" TEXT NOT NULL DEFAULT 'text'`],
    ["answerDurationSec", `"answerDurationSec" INTEGER`],
    ["audioMetaJson", `"audioMetaJson" TEXT NOT NULL DEFAULT '{}'`],
    ["expressionJson", `"expressionJson" TEXT NOT NULL DEFAULT '{}'`],
  ],
  ReviewCard: [
    ["priority", `"priority" INTEGER NOT NULL DEFAULT 50`],
    ["dueAt", `"dueAt" DATETIME`],
  ],
};

const indexSql = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "Company_name_key" ON "Company"("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Topic_name_key" ON "Topic"("name")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeCard_companyId_idx" ON "KnowledgeCard"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeCard_topicId_idx" ON "KnowledgeCard"("topicId")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeCard_difficulty_idx" ON "KnowledgeCard"("difficulty")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeCard_mastery_idx" ON "KnowledgeCard"("mastery")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeCard_questionType_idx" ON "KnowledgeCard"("questionType")`,
  `CREATE INDEX IF NOT EXISTS "KnowledgeCard_priorityScore_idx" ON "KnowledgeCard"("priorityScore")`,
  `CREATE INDEX IF NOT EXISTS "JobTarget_companyId_idx" ON "JobTarget"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "JobTarget_resumeProfileId_idx" ON "JobTarget"("resumeProfileId")`,
  `CREATE INDEX IF NOT EXISTS "InterviewSession_mode_idx" ON "InterviewSession"("mode")`,
  `CREATE INDEX IF NOT EXISTS "InterviewSession_roundType_idx" ON "InterviewSession"("roundType")`,
  `CREATE INDEX IF NOT EXISTS "InterviewSession_status_idx" ON "InterviewSession"("status")`,
  `CREATE INDEX IF NOT EXISTS "InterviewSession_jobTargetId_idx" ON "InterviewSession"("jobTargetId")`,
  `CREATE INDEX IF NOT EXISTS "InterviewTurn_sessionId_idx" ON "InterviewTurn"("sessionId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "InterviewTurn_sessionId_order_key" ON "InterviewTurn"("sessionId", "order")`,
  `CREATE INDEX IF NOT EXISTS "ReviewCard_status_idx" ON "ReviewCard"("status")`,
  `CREATE INDEX IF NOT EXISTS "ReviewCard_sessionId_idx" ON "ReviewCard"("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "ReviewCard_priority_idx" ON "ReviewCard"("priority")`,
  `CREATE INDEX IF NOT EXISTS "SprintPlan_companyId_idx" ON "SprintPlan"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "SprintPlan_jobTargetId_idx" ON "SprintPlan"("jobTargetId")`,
  `CREATE INDEX IF NOT EXISTS "SprintPlan_status_idx" ON "SprintPlan"("status")`,
  `CREATE INDEX IF NOT EXISTS "SprintTask_planId_idx" ON "SprintTask"("planId")`,
  `CREATE INDEX IF NOT EXISTS "SprintTask_status_idx" ON "SprintTask"("status")`,
  `CREATE INDEX IF NOT EXISTS "SprintTask_dayIndex_idx" ON "SprintTask"("dayIndex")`,
  `CREATE INDEX IF NOT EXISTS "LabSession_type_idx" ON "LabSession"("type")`,
  `CREATE INDEX IF NOT EXISTS "LabSession_status_idx" ON "LabSession"("status")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceReport_companyId_idx" ON "ExperienceReport"("companyId")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceReport_roleName_idx" ON "ExperienceReport"("roleName")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceReport_interviewDate_idx" ON "ExperienceReport"("interviewDate")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceReport_verified_idx" ON "ExperienceReport"("verified")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceReport_confidence_idx" ON "ExperienceReport"("confidence")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceRound_reportId_idx" ON "ExperienceRound"("reportId")`,
  `CREATE INDEX IF NOT EXISTS "ExperienceRound_roundType_idx" ON "ExperienceRound"("roundType")`,
];

async function tableColumns(tableName) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
  return new Set(rows.map((row) => row.name));
}

async function ensureColumns() {
  for (const [tableName, columns] of Object.entries(columnSql)) {
    const existing = await tableColumns(tableName);
    for (const [name, definition] of columns) {
      if (!existing.has(name)) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN ${definition}`);
      }
    }
  }
}

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");
  for (const sql of tableSql) {
    await prisma.$executeRawUnsafe(sql);
  }
  await ensureColumns();
  for (const sql of indexSql) {
    await prisma.$executeRawUnsafe(sql);
  }
}

main()
  .then(() => {
    console.log("Database schema is ready.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
