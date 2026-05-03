import { NextResponse } from "next/server";
import { getGithubTrendRepository, updateGithubTrendRepository } from "@/lib/github-trends";

export const dynamic = "force-dynamic";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "仓库 ID 无效。" }, { status: 400 });
  }

  const repository = await getGithubTrendRepository(id);
  if (!repository) {
    return NextResponse.json({ error: "仓库不存在。" }, { status: 404 });
  }

  return NextResponse.json({ repository });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (!id) {
    return NextResponse.json({ error: "仓库 ID 无效。" }, { status: 400 });
  }

  const repository = await updateGithubTrendRepository(id, {
    isFavorite: typeof body.isFavorite === "boolean" ? body.isFavorite : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  });

  return NextResponse.json({ repository });
}
