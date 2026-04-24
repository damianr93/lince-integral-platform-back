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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const external_token_guard_1 = require("../guards/external-token.guard");
const customers_service_1 = require("./customers.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
let WebhooksController = class WebhooksController {
    constructor(customersService) {
        this.customersService = customersService;
    }
    createFromManychat(dto) {
        return this.customersService.create(dto);
    }
    createFromWebchat(dto) {
        return this.customersService.create({ ...dto, medioAdquisicion: 'WEB' });
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('contacts/manychat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "createFromManychat", null);
__decorate([
    (0, common_1.Post)('contacts/webchat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "createFromWebchat", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('crm'),
    (0, common_1.UseGuards)(external_token_guard_1.ExternalTokenGuard),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map