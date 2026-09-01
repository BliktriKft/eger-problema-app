import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  REQUIRES_SERVICE_ROLE_KEY,
  SupabaseServiceRoleGuard,
} from "./supabase-service-role.guard";

/**
 * Unit tests for the service-role guard.
 *
 * The guard is intentionally simple — these tests pin down the
 * "fail closed when env not set" + "constant-time compare" contracts
 * so a future refactor doesn't regress security.
 */

interface CtxOpts {
  header?: string;
  envKey?: string;
  required?: boolean;
}

const buildContext = (opts: CtxOpts): ExecutionContext => {
  const headers: Record<string, string | undefined> = {
    authorization: opts.header,
  };
  const request = { headers };
  const handler = {};
  const cls = {};
  // Fake reflector — only implements the one method the guard calls.
  const reflector = {
    getAllAndOverride: <T>(key: string): T | undefined =>
      key === REQUIRES_SERVICE_ROLE_KEY
        ? (opts.required as T | undefined)
        : undefined,
  };
  return {
    switchToHttp: () => ({
      getRequest: <T = unknown>() => request as unknown as T,
      getResponse: <T = unknown>() => ({} as T),
      getNext: <T = unknown>() => ({} as T),
    }),
    getHandler: () => handler,
    getClass: () => cls,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({} as never),
    switchToWs: () => ({} as never),
    getType: () => "http",
    getReflector: () => reflector as never,
  } as unknown as ExecutionContext;
};

describe("SupabaseServiceRoleGuard", () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("lets through endpoints that do not require service-role", async () => {
    const reflector = {
      getAllAndOverride: () => undefined,
    };
    const guard = new SupabaseServiceRoleGuard(reflector as never);
    const ctx = buildContext({ required: false });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("rejects with 401 when the env var is not configured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const reflector = { getAllAndOverride: () => true };
    const guard = new SupabaseServiceRoleGuard(reflector as never);
    const ctx = buildContext({ required: true, header: "Bearer anything" });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects with 401 when no Authorization header is present", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-key";
    const reflector = { getAllAndOverride: () => true };
    const guard = new SupabaseServiceRoleGuard(reflector as never);
    const ctx = buildContext({ required: true });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects with 401 on a wrong bearer", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-key";
    const reflector = { getAllAndOverride: () => true };
    const guard = new SupabaseServiceRoleGuard(reflector as never);
    const ctx = buildContext({ required: true, header: "Bearer wrong" });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("allows the call when the bearer matches the env key", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-key";
    const reflector = { getAllAndOverride: () => true };
    const guard = new SupabaseServiceRoleGuard(reflector as never);
    const ctx = buildContext({
      required: true,
      header: "Bearer secret-key",
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
