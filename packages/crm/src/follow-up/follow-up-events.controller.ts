import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard, ModuleGuard, RequireModule } from '@lince/auth';
import { ModuleKey } from '@lince/types';
import { FollowUpEventsService } from './follow-up-events.service';
import { UpdateFollowUpEventStatusDto } from './dto/update-follow-up-event-status.dto';

@Controller('crm/follow-up/events')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.CRM)
export class FollowUpEventsController {
  constructor(private readonly followUpEventsService: FollowUpEventsService) {}

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpEventStatusDto,
  ) {
    const eventObjectId = new Types.ObjectId(id);

    if (dto.status === 'COMPLETED') {
      return this.followUpEventsService.markEventCompleted(
        eventObjectId,
        new Date(),
        dto.notes,
      );
    }

    if (dto.status === 'CANCELLED') {
      await this.followUpEventsService.markEventCancelled(
        eventObjectId,
        dto.notes,
      );
      return this.followUpEventsService.findById(id);
    }

    if (dto.status === 'READY') {
      await this.followUpEventsService.upsertManualStatus(
        id,
        'READY',
        dto.notes,
      );
      return this.followUpEventsService.findById(id);
    }

    return this.followUpEventsService.findById(id);
  }
}
