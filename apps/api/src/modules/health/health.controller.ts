import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

/**
 * Health controller placeholder.
 *
 * The real implementation (Task 5) uses `@nestjs/terminus` to check DB
 * connectivity, memory, and disk. We keep it minimal here so the module
 * graph compiles without extra imports — the full version lands once
 * the deployment infra is wired.
 */
@ApiTags("health")
@Controller("health")
export class HealthController {
  /**
   * Liveness probe — returns 200 as long as the process is responsive.
   * Kubernetes does not restart the pod on dependency failure here.
   */
  @Get("live")
  @ApiOperation({ summary: "Liveness probe (process responsive)" })
  live(): { status: string } {
    return { status: "ok" };
  }

  /**
   * Readiness probe stub. Real implementation lives behind `@nestjs/terminus`
   * and checks Postgres + memory + disk.
   */
  @Get("ready")
  @ApiOperation({ summary: "Readiness probe (dependencies healthy)" })
  ready(): { status: string } {
    return { status: "ok" };
  }
}