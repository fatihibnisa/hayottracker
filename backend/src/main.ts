import { existsSync } from 'fs';
import { join } from 'path';
import { json } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: true });
  app.use(json({ limit: '15mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const uploadsDir = process.env.UPLOADS_DIR || join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // Desktop (Electron) build only: serve the pre-built static frontend from the same origin.
  const frontendDist = process.env.FRONTEND_DIST_PATH;
  if (frontendDist && existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist, { index: 'index.html' });
  }

  const config = new DocumentBuilder()
    .setTitle('Hayot Tracker API')
    .setDescription("Shaxsiy hayotni boshqarish ilovasi uchun professional API")
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  // Inside the desktop (Electron) build we only ever need loopback access,
  // which also avoids triggering a Windows Firewall prompt on first run.
  const host = process.env.ELECTRON_APP === '1' ? '127.0.0.1' : '0.0.0.0';
  await app.listen(port, host);
  console.log(`Hayot Tracker API http://localhost:${port}/api manzilida ishga tushdi`);
  console.log(`Swagger hujjati: http://localhost:${port}/api/docs`);
}

bootstrap();
