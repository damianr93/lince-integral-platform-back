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
var YCloudClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YCloudClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const YCLOUD_BASE = 'https://api.ycloud.com/v2';
const TRANSIENT_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);
let YCloudClient = YCloudClient_1 = class YCloudClient {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(YCloudClient_1.name);
    }
    get apiKey() {
        return this.config.getOrThrow('YCLOUD_API_KEY');
    }
    headers() {
        return {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
        };
    }
    normalizeTemplate(raw) {
        const body = raw.components?.find((c) => c.type === 'BODY');
        const header = raw.components?.find((c) => c.type === 'HEADER');
        const footer = raw.components?.find((c) => c.type === 'FOOTER');
        const buttonsComp = raw.components?.find((c) => c.type === 'BUTTONS');
        const headerExample = header?.format === 'IMAGE'
            ? header?.example?.header_url?.[0]
            : undefined;
        return {
            id: raw.officialTemplateId,
            wabaId: raw.wabaId,
            name: raw.name,
            language: raw.language,
            status: raw.status,
            category: raw.category,
            content: body?.text ?? '',
            headerFormat: header?.format,
            headerExample,
            footerText: footer?.text,
            buttons: buttonsComp?.buttons,
        };
    }
    async listApprovedTemplates() {
        const results = [];
        let page = 1;
        const limit = 100;
        while (true) {
            const url = `${YCLOUD_BASE}/whatsapp/templates?page=${page}&limit=${limit}&includeTotal=false`;
            const res = await fetch(url, { headers: this.headers() });
            if (!res.ok) {
                const body = await res.text();
                this.logger.error(`YCloud templates fetch failed: ${res.status} ${body}`);
                throw this.buildError(res.status, body);
            }
            const data = (await res.json());
            const approved = data.items
                .filter((t) => t.status === 'APPROVED')
                .map((t) => this.normalizeTemplate(t));
            results.push(...approved);
            if (data.items.length < limit)
                break;
            page++;
        }
        return results;
    }
    async sendTemplateMessage(params) {
        const components = [];
        if (params.headerImageUrl) {
            components.push({
                type: 'header',
                parameters: [{ type: 'image', image: { link: params.headerImageUrl } }],
            });
        }
        const body = {
            from: params.phoneNumberId,
            to: params.to,
            type: 'template',
            template: {
                name: params.templateName,
                language: { code: params.templateLanguage },
                ...(components.length > 0 ? { components } : {}),
            },
            ...(params.externalId ? { externalId: params.externalId } : {}),
        };
        const res = await fetch(`${YCLOUD_BASE}/whatsapp/messages/sendDirectly`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const raw = await res.text();
            this.logger.warn(`YCloud send failed [${res.status}]: ${raw}`);
            throw this.buildError(res.status, raw);
        }
        return res.json();
    }
    async verifyWebhookSignature(rawBody, signatureHeader) {
        const secret = this.config.get('YCLOUD_WEBHOOK_SECRET', '');
        if (!secret) {
            this.logger.warn('YCLOUD_WEBHOOK_SECRET not configured — skipping signature validation');
            return true;
        }
        const parts = Object.fromEntries(signatureHeader.split(',').map((p) => p.split('=')));
        const timestamp = parts['t'];
        const signature = parts['s'];
        if (!timestamp || !signature)
            return false;
        const payload = `${timestamp}.${rawBody}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(payload);
        const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', key, messageData);
        const computed = Buffer.from(sig).toString('hex');
        return computed.length === signature.length &&
            computed.split('').every((c, i) => c === signature[i]);
    }
    buildError(status, body) {
        let parsed = {};
        try {
            parsed = JSON.parse(body);
        }
        catch { /* ok */ }
        // YCloud wraps errors as { "error": { "code": "...", "message": "..." } }
        const inner = parsed['error'] ?? parsed;
        return {
            code: inner['code'] ?? 'UNKNOWN',
            message: inner['message'] ?? body,
            status,
            isTransient: TRANSIENT_HTTP_STATUSES.has(status),
        };
    }
};
exports.YCloudClient = YCloudClient;
exports.YCloudClient = YCloudClient = YCloudClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], YCloudClient);
//# sourceMappingURL=ycloud.client.js.map