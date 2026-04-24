import { FollowUpEventsService } from './follow-up-events.service';
import { UpdateFollowUpEventStatusDto } from './dto/update-follow-up-event-status.dto';
export declare class FollowUpEventsController {
    private readonly followUpEventsService;
    constructor(followUpEventsService: FollowUpEventsService);
    updateStatus(id: string, dto: UpdateFollowUpEventStatusDto): Promise<import("./schemas/follow-up-event.schema").FollowUpEvent | null>;
}
//# sourceMappingURL=follow-up-events.controller.d.ts.map