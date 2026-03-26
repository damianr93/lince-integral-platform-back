import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerSchema } from '../customers/schemas/customer.schema';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { FollowUpModule } from '../follow-up/follow-up.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Customer', schema: CustomerSchema }]),
    FollowUpModule,
    GeoModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
