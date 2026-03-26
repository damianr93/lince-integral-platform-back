import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@lince/auth';
import { CustomersModule } from './customers/customers.module';
import { FollowUpModule } from './follow-up/follow-up.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SatisfactionModule } from './satisfaction/satisfaction.module';
import { GeoModule } from './geo/geo.module';
import { MarketingModule } from './marketing/marketing.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('CRM_MONGO_URI'),
      }),
    }),
    AuthModule,
    CustomersModule,
    FollowUpModule,
    AnalyticsModule,
    SatisfactionModule,
    GeoModule,
    MarketingModule,
  ],
})
export class CrmModule {}
