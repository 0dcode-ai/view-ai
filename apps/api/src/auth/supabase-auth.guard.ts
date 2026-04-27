import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_ROUTE } from "./public.decorator";
import type { AuthUser } from "./auth-user";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject("SUPABASE_CLIENT") private readonly supabase: SupabaseClient | null,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthUser;
    }>();

    if (process.env.AUTH_DISABLED === "true") {
      const devEmail = process.env.DEV_USER_EMAIL || "dev@example.com";
      request.user = {
        id: process.env.DEV_USER_ID || devEmail,
        email: devEmail,
      };
      return true;
    }

    const header = request.headers.authorization;
    const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

    if (!token || !this.supabase) {
      throw new UnauthorizedException("请先登录。");
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user?.id || !data.user.email) {
      throw new UnauthorizedException("登录已过期，请重新登录。");
    }

    request.user = {
      id: data.user.id,
      email: data.user.email,
    };
    return true;
  }
}
