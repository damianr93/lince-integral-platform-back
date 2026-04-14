import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

// BigInt no es serializable por JSON.stringify nativo; las columnas amountKey lo usan
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(
    json({
      limit: '10mb',
      verify: (req: any, _res, buf: Buffer) => { req.rawBody = buf; },
    }),
  );
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // CORS — acepta origenes de la variable de entorno
  const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);

  // TODO-2 [FÁCIL]: Reemplazar console.log con el Logger de NestJS.
  //
  // El problema: console.log imprime en crudo sin timestamp ni nivel de log.
  // En producción no podés filtrar por severidad (info, warn, error) ni saber
  // cuándo pasó. NestJS ya incluye un Logger que formatea todo correctamente.
  //
  // Cómo se usa:
  //   1. Crear una instancia ANTES del bootstrap:
  //        const logger = new Logger('Bootstrap');
  //   2. Reemplazar el console.log de abajo por:
  //        logger.log(`API corriendo en http://localhost:${port}/api`);
  //
  // Logger tiene estos niveles: logger.log() / logger.warn() / logger.error()
  // Fijate que Logger ya está importado en la línea 3 de este archivo.
  //
  // Extra: buscá con Ctrl+Shift+F en el proyecto "console.log" y "console.error"
  // y reemplazalos también en analytics.service.ts (hay varios console.error ahí).
  console.log(`🚀 API corriendo en http://localhost:${port}/api`);
}

bootstrap();
