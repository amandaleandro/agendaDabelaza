import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🔵 Bootstrap starting...');
  
  const app = await NestFactory.create(AppModule);
  console.log('🔵 NestFactory.create completed');

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });
  console.log('🔵 CORS enabled');
  
  app.setGlobalPrefix('api');
  console.log('🔵 Global prefix set');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  console.log('🔵 Global pipes configured');

  const port = process.env.API_PORT || 3010;
  const host = '0.0.0.0';
  
  console.log(`🔵 Starting listen on ${host}:${port}...`);
  await app.listen(port, host);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`🔵 Process PID: ${process.pid}`);
  
  // Keep alive
  process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM received, shutting down gracefully...');
    app.close();
  });
  
  process.on('SIGINT', () => {
    console.log('⚠️  SIGINT received, shutting down gracefully...');
    app.close();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
