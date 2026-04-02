import { Module } from '@nestjs/common';
import { OcrNotificationsService } from './notifications.service';

@Module({
  providers: [OcrNotificationsService],
  exports:   [OcrNotificationsService],
})
export class OcrNotificationsModule {}
