import { NextResponse } from "next/server";
import { z } from "zod";
import { parseExperienceReport } from "@/lib/ai";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  rawText: z.string().min(20),
  companyName: z.string().optional(),
  roleName: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "请粘贴完整面经内容。" }, { status: 400 });
  }

  const draft = await parseExperienceReport(parsed.data);
  return NextResponse.json({ draft });
}
