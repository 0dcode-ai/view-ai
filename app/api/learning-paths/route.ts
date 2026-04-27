import { NextResponse } from "next/server";
import { learningPaths, pickLearningPath } from "@/lib/learning-paths";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  return NextResponse.json({
    activePath: pickLearningPath(role),
    paths: learningPaths,
  });
}
