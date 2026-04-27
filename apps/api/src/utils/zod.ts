import { BadRequestException } from "@nestjs/common";
import type { ZodError, ZodType } from "zod";

export function parseBody<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  throw new BadRequestException(formatZodError(parsed.error));
}

function formatZodError(error: ZodError) {
  const first = error.issues[0];
  return first ? `${first.path.join(".") || "body"}: ${first.message}` : "请求参数无效。";
}
