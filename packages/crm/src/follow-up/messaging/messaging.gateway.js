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
var MessagingGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingGateway = void 0;
const common_1 = require("@nestjs/common");
let MessagingGateway = MessagingGateway_1 = class MessagingGateway {
    constructor(channels) {
        this.logger = new common_1.Logger(MessagingGateway_1.name);
        this.channels = new Map();
        channels.forEach((channel) => {
            this.channels.set(channel.type, channel);
        });
    }
    hasChannel(type) {
        return this.channels.has(type);
    }
    async dispatch(type, payload) {
        const channel = this.channels.get(type);
        if (!channel) {
            this.logger.warn(`No channel registered for type ${type}. Payload will be dropped.`);
            return;
        }
        await channel.send(payload);
    }
};
exports.MessagingGateway = MessagingGateway;
exports.MessagingGateway = MessagingGateway = MessagingGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Array])
], MessagingGateway);
//# sourceMappingURL=messaging.gateway.js.map