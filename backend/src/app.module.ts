import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppointmentModule } from './modules/AppointmentModule';
import { PaymentModule } from './modules/PaymentModule';
import { SubscriptionModule } from './modules/SubscriptionModule';
import { ProfessionalModule } from './modules/ProfessionalModule';
import { ClientModule } from './modules/ClientModule';
import { ClientSubscriptionModule } from './modules/ClientSubscriptionModule';
import { ProductModule } from './modules/ProductModule';
import { PublicModule } from './modules/PublicModule';
import { AuthModule } from './modules/AuthModule';
import { DashboardModule } from './modules/DashboardModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 👈 IMPORTANTE
    }),
    AppointmentModule,
    PaymentModule,
    SubscriptionModule,
    ProfessionalModule,
    ClientModule,
    ClientSubscriptionModule,
    ProductModule,
    PublicModule,
    AuthModule,
    DashboardModule,
  ],
})
export class AppModule {}
