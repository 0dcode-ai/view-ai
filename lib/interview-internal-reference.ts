import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SeedQuestion } from "./question-bank";

const dataFilePath = path.join(process.cwd(), "data", "interview-internal-reference.json");

let cachedQuestions: SeedQuestion[] | null = null;

export async function loadInterviewInternalReferenceQuestions() {
  if (cachedQuestions) {
    return cachedQuestions;
  }

  const content = await readFile(dataFilePath, "utf8");
  cachedQuestions = JSON.parse(content) as SeedQuestion[];
  return cachedQuestions;
}
