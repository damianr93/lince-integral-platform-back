"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const follow_up_event_schema_1 = require("./schemas/follow-up-event.schema");
const follow_up_task_schema_1 = require("./schemas/follow-up-task.schema");
const customer_schema_1 = require("../customers/schemas/customer.schema");
const follow_up_events_service_1 = require("./follow-up-events.service");
const follow_up_events_controller_1 = require("./follow-up-events.controller");
const customer_follow_up_service_1 = require("./customer-follow-up.service");
const messaging_providers_1 = require("./messaging/messaging.providers");
const messaging_gateway_1 = require("./messaging/messaging.gateway");
let FollowUpModule = class FollowUpModule {
};
exports.FollowUpModule = FollowUpModule;
exports.FollowUpModule = FollowUpModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([
                { name: 'FollowUpEvent', schema: follow_up_event_schema_1.FollowUpEventSchema },
                { name: 'FollowUpTask', schema: follow_up_task_schema_1.FollowUpTaskSchema },
                { name: 'Customer', schema: customer_schema_1.CustomerSchema },
            ]),
        ],
        controllers: [follow_up_events_controller_1.FollowUpEventsController],
        providers: [
            follow_up_events_service_1.FollowUpEventsService,
            customer_follow_up_service_1.CustomerFollowUpService,
            ...messaging_providers_1.messagingProviders,
        ],
        exports: [
            follow_up_events_service_1.FollowUpEventsService,
            customer_follow_up_service_1.CustomerFollowUpService,
            messaging_gateway_1.MessagingGateway,
        ],
    })
], FollowUpModule);
//# sourceMappingURL=follow-up.module.js.map