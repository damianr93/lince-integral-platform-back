"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const customer_schema_1 = require("./schemas/customer.schema");
const customers_service_1 = require("./customers.service");
const customers_controller_1 = require("./customers.controller");
const webhooks_controller_1 = require("./webhooks.controller");
const follow_up_module_1 = require("../follow-up/follow-up.module");
const external_token_guard_1 = require("../guards/external-token.guard");
let CustomersModule = class CustomersModule {
};
exports.CustomersModule = CustomersModule;
exports.CustomersModule = CustomersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([{ name: 'Customer', schema: customer_schema_1.CustomerSchema }]),
            follow_up_module_1.FollowUpModule,
        ],
        controllers: [customers_controller_1.CustomersController, webhooks_controller_1.WebhooksController],
        providers: [customers_service_1.CustomersService, external_token_guard_1.ExternalTokenGuard],
        exports: [customers_service_1.CustomersService, mongoose_1.MongooseModule],
    })
], CustomersModule);
//# sourceMappingURL=customers.module.js.map