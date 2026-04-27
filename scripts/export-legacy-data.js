const { writeFile, mkdir } = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const [
    companies,
    topics,
    knowledgeCards,
    resumeProfiles,
    jobTargets,
    interviewSessions,
    interviewTurns,
    reviewCards,
    sprintPlans,
    sprintTasks,
    labSessions,
    experienceReports,
    experienceRounds,
  ] = await Promise.all([
    prisma.company.findMany(),
    prisma.topic.findMany(),
    prisma.knowledgeCard.findMany(),
    prisma.resumeProfile.findMany(),
    prisma.jobTarget.findMany(),
    prisma.interviewSession.findMany(),
    prisma.interviewTurn.findMany(),
    prisma.reviewCard.findMany(),
    prisma.sprintPlan.findMany(),
    prisma.sprintTask.findMany(),
    prisma.labSession.findMany(),
    prisma.experienceReport.findMany(),
    prisma.experienceRound.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    companies,
    topics,
    knowledgeCards,
    resumeProfiles,
    jobTargets,
    interviewSessions,
    interviewTurns,
    reviewCards,
    sprintPlans,
    sprintTasks,
    labSessions,
    experienceReports,
    experienceRounds,
  };
  const outputPath = path.join(process.cwd(), "data", "legacy-export.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Exported legacy data to ${outputPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
