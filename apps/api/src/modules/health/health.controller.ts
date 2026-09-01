import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaClient } from "@prisma/client";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaClient: PrismaClient,
  ) {}

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
   * Readiness probe — checks DB, memory, and disk. Returns 503 if any
   * dependency is unavailable.
   */
  @Get("ready")
  @HealthCheck()
  @ApiOperation({ summary: "Readiness probe (dependencies healthy)" })
  ready() {
    return this.health.check([
      () => this.prisma.pingCheck("postgres", this.prismaClient),
      () => this.memory.checkHeap("memory_heap", 512 * 1024 * 1024),
      () => this.memory.checkRSS("memory_rss", 1024 * 1024 * 1024),
      () =>
        this.disk.checkStorage("disk", {
          thresholdPercent: 0.9,
          path: "/",
        }),
    ]);
  }
}