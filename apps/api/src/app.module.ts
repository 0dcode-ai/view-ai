import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { createClient } from "@supabase/supabase-js";
import { ApiControllers } from "./controllers";
import { SupabaseAuthGuard } from "./auth/supabase-auth.guard";
import { PrismaService } from "./prisma.service";
import { CoreService } from "./core.service";

@Module({
  controllers: ApiControllers,
  providers: [
    PrismaService,
    CoreService,
    {
      provide: "SUPABASE_CLIENT",
      useFactory: () => {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_ANON_KEY;
        return url && key ? createClient(url, key) : null;
      },
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
