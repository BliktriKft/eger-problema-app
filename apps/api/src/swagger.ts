/**
 * Standalone entrypoint used by `pnpm --filter @eger/api docs:export:ci`
 * to render the OpenAPI spec without starting the HTTP server.
 *
 * It boots the full NestJS module graph (same one main.ts uses), then
 * writes the resulting JSON spec to `apps/api/openapi.json` and exits.
 *
 * Run with:
 *   pnpm --filter @eger/api docs:export:ci
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Eger Város Probléma Térkép API')
    .setDescription(
      'Backend API for the Eger community issue-reporting platform.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const outPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outPath}`);

  await app.close();
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to export OpenAPI spec', err);
    process.exit(1);
  });