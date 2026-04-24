"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const campaign_schema_1 = require("./schemas/campaign.schema");
const campaign_recipient_schema_1 = require("./schemas/campaign-recipient.schema");
const campaign_log_schema_1 = require("./schemas/campaign-log.schema");
const direct_message_schema_1 = require("./schemas/direct-message.schema");
const customer_schema_1 = require("../customers/schemas/customer.schema");
const marketing_service_1 = require("./marketing.service");
const marketing_controller_1 = require("./marketing.controller");
const ycloud_client_1 = require("./ycloud.client");
let MarketingModule = class MarketingModule {
};
exports.MarketingModule = MarketingModule;
exports.MarketingModule = MarketingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([
                { name: 'Campaign', schema: campaign_schema_1.CampaignSchema },
                { name: 'CampaignRecipient', schema: campaign_recipient_schema_1.CampaignRecipientSchema },
                { name: 'CampaignLog', schema: campaign_log_schema_1.CampaignLogSchema },
                { name: 'DirectMessage', schema: direct_message_schema_1.DirectMessageSchema },
                { name: 'Customer', schema: customer_schema_1.CustomerSchema },
            ]),
        ],
        controllers: [marketing_controller_1.MarketingController],
        providers: [marketing_service_1.MarketingService, ycloud_client_1.YCloudClient],
    })
], MarketingModule);
//# sourceMappingURL=marketing.module.js.map