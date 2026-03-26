import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SatisfactionSchema } from './schemas/satisfaction.schema';
import { SatisfactionService } from './satisfaction.service';
import { SatisfactionController } from './satisfaction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Satisfaction', schema: SatisfactionSchema }]),
  ],
  controllers: [SatisfactionController],
  providers: [SatisfactionService],
})
export class SatisfactionModule {}
