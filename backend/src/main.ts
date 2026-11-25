import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Parse HTTP Cookies
  app.use(cookieParser());

  // Enable CORS with Credentials
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('PromptToInvoice API')
    .setDescription(
      'Production-ready NestJS Backend for PromptToInvoice: AI-Powered Invoicing for the Modern Small Business.',
    )
    .setVersion('1.0.0')
    .addTag('AI Invoice Assistant', 'Natural Language conversational invoice generation')
    .addTag('Invoices', 'Invoice lifecycle and payment tracking')
    .addTag('Clients', 'Client CRM and billing statistics')
    .addTag('Business Profiles', 'Multi-entity business and branding configuration')
    .addTag('Analytics & Business Insights', 'Revenue metrics, cashflow trends, and AI suggestions')
    .addTag('Subscriptions & Plans', 'Tiered plans and quota management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 PromptToInvoice NestJS Backend running at http://localhost:${port}`);
  logger.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
