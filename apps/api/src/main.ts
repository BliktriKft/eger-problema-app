import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({ contentSecurityPolicy: false }));

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Eger Város Probléma Térkép API')
    .setDescription('Community problem-reporting API for Eger, Hungary.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // One-shot OpenAPI export (used by `pnpm docs:export:ci`).
  if (process.env.EXPORT_OPENAPI === '1') {
    const outPath = join(process.cwd(), 'openapi.json');
    writeFileSync(outPath, JSON.stringify(document, null, 2));
    // eslint-disable-next-line no-console
    console.log(`OpenAPI spec written to ${outPath}`);
    await app.close();
    process.exit(0);
  }

  const port = Number(process.env.PORT ?? 8000);
  await app.listen(port);
  app
    .get(Logger)
    .log(`Eger API listening on http://localhost:${port} (docs at /api/docs)`);
}

void bootstrap();
