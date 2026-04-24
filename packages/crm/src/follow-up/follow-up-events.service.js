"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FollowUpEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpEventsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let FollowUpEventsService = FollowUpEventsService_1 = class FollowUpEventsService {
    constructor(followUpEventModel) {
        this.followUpEventModel = followUpEventModel;
        this.logger = new common_1.Logger(FollowUpEventsService_1.name);
    }
    async createEvent(payload) {
        return this.followUpEventModel.create({
            ...payload,
            status: 'SCHEDULED',
        });
    }
    async linkTaskToEvent(eventId, taskId) {
        await this.followUpEventModel.updateOne({ _id: eventId }, { $set: { followUpTaskId: taskId } });
    }
    async cancelOpenEventsForCustomer(customerId) {
        await this.followUpEventModel.updateMany({
            customerId,
            status: { $in: ['SCHEDULED', 'READY'] },
        }, {
            $set: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                notes: 'Cancelado por cambio de estado del cliente',
            },
        });
    }
    async markDueEventsAsReady(referenceDate = new Date()) {
        const scheduledEvents = await this.followUpEventModel
            .find({
            status: 'SCHEDULED',
            scheduledFor: { $lte: referenceDate },
        })
            .sort({ scheduledFor: 1 })
            .limit(50)
            .lean();
        const updatedEvents = [];
        for (const event of scheduledEvents) {
            const updated = await this.followUpEventModel
                .findOneAndUpdate({ _id: event._id, status: 'SCHEDULED' }, {
                $set: {
                    status: 'READY',
                    readyAt: referenceDate,
                },
            }, { new: true })
                .lean();
            if (updated) {
                updatedEvents.push(updated);
            }
        }
        return updatedEvents;
    }
    async markEventCompleted(eventId, completedAt = new Date(), notes) {
        await this.followUpEventModel.updateOne({ _id: eventId }, {
            $set: {
                status: 'COMPLETED',
                completedAt,
                notes,
            },
        });
        return this.followUpEventModel.findById(eventId).lean();
    }
    async markEventCancelled(eventId, reason) {
        await this.followUpEventModel.updateOne({ _id: eventId }, {
            $set: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                notes: reason,
            },
        });
    }
    async upsertManualStatus(eventId, status, notes) {
        const updates = {
            status,
            notes,
        };
        if (status === 'READY') {
            updates.readyAt = new Date();
        }
        if (status === 'COMPLETED') {
            updates.completedAt = new Date();
        }
        if (status === 'CANCELLED') {
            updates.cancelledAt = new Date();
        }
        const result = await this.followUpEventModel.updateOne({ _id: eventId }, { $set: updates });
        if (result.matchedCount === 0) {
            this.logger.warn(`No se encontró evento de seguimiento ${eventId} para actualizar`);
        }
    }
    async getEventsByStatus(statuses, limit = 50, assignedTo) {
        const filter = {
            status: { $in: statuses },
        };
        if (assignedTo && assignedTo.toUpperCase() !== 'ALL') {
            filter.assignedTo = assignedTo.toUpperCase();
        }
        return this.followUpEventModel
            .find(filter)
            .sort({ scheduledFor: 1 })
            .limit(limit)
            .lean();
    }
    async findById(eventId) {
        return this.followUpEventModel.findById(eventId).lean();
    }
};
exports.FollowUpEventsService = FollowUpEventsService;
exports.FollowUpEventsService = FollowUpEventsService = FollowUpEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('FollowUpEvent')),
    __metadata("design:paramtypes", [mongoose_2.Model])
], FollowUpEventsService);
//# sourceMappingURL=follow-up-events.service.js.map