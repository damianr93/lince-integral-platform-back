import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CustomerSchema } from './schemas/customer.schema';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { WebhooksController } from './webhooks.controller';
import { FollowUpModule } from '../follow-up/follow-up.module';
import { ExternalTokenGuard } from '../guards/external-token.guard';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: 'Customer', schema: CustomerSchema }]),
    FollowUpModule,
  ],
  controllers: [CustomersController, WebhooksController],
  providers: [CustomersService, ExternalTokenGuard],
  exports: [CustomersService, MongooseModule],
})
export class CustomersModule {}
