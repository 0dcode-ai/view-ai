import { NextResponse } from "next/server";
import { z } from "zod";
import { transcribeInterviewAnswer } from "@/lib/ai";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  transcriptHint: z.string().optional(),
  fileName: z.string().optional(),
  durationSec: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "转写参数无效。" }, { status: 400 });
  }

  return NextResponse.json(transcribeInterviewAnswer(parsed.data));
}
