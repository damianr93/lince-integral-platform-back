"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const auth_1 = require("@lince/auth");
const customers_module_1 = require("./customers/customers.module");
const follow_up_module_1 = require("./follow-up/follow-up.module");
const analytics_module_1 = require("./analytics/analytics.module");
const satisfaction_module_1 = require("./satisfaction/satisfaction.module");
const geo_module_1 = require("./geo/geo.module");
const marketing_module_1 = require("./marketing/marketing.module");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    uri: config.getOrThrow('CRM_MONGO_URI'),
                }),
            }),
            auth_1.AuthModule,
            customers_module_1.CustomersModule,
            follow_up_module_1.FollowUpModule,
            analytics_module_1.AnalyticsModule,
            satisfaction_module_1.SatisfactionModule,
            geo_module_1.GeoModule,
            marketing_module_1.MarketingModule,
        ],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map