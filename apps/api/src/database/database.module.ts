import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

/**
 * Prisma client wrapper. We extend the generated client so the
 * connection lifecycle is managed by Nest. Inject via the
 * `PRISMA_CLIENT` token (typed as `PrismaClient`) in services.
 *
 * We deliberately do NOT run queries through the Supabase connection
 * pooler (port 6543) for migrations — those use `DIRECT_URL`. At
 * runtime we hit the pooler via `DATABASE_URL`. See ADR-0004.
 */
@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: (): PrismaClient =>
        new PrismaClient({
          log:
            process.env.NODE_ENV === 'production'
              ? ['error']
              : ['warn', 'error'],
        }),
    },
  ],
  exports: [PRISMA_CLIENT],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    // Nest handles DI teardown via the factory's `onModuleDestroy`,
    // but we expose a hook here for future graceful-shutdown logic.
  }
}
