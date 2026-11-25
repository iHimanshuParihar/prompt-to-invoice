import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AiModule,
    InvoicesModule,
    ClientsModule,
    ProfilesModule,
    AnalyticsModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
