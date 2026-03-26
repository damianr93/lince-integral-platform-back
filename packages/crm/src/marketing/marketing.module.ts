import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CampaignSchema } from './schemas/campaign.schema';
import { CampaignRecipientSchema } from './schemas/campaign-recipient.schema';
import { CustomerSchema } from '../customers/schemas/customer.schema';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { YCloudClient } from './ycloud.client';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'Campaign', schema: CampaignSchema },
      { name: 'CampaignRecipient', schema: CampaignRecipientSchema },
      { name: 'Customer', schema: CustomerSchema },
    ]),
  ],
  controllers: [MarketingController],
  providers: [MarketingService, YCloudClient],
})
export class MarketingModule {}
