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
var AdmsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmsController = void 0;
const common_1 = require("@nestjs/common");
const adms_service_1 = require("./adms.service");
/**
 * AdmsController — Integración ZKTeco via protocolo ADMS (HTTP push)
 *
 * Los relojes ZKTeco envían fichajes a:
 *   GET  /iclock/cdata   → handshake inicial, el reloj pide configuración
 *   POST /iclock/cdata   → envío de fichajes (ATTLOG lines)
 *   GET  /iclock/getrequest  → heartbeat periódico
 *   POST /iclock/devicecmd   → confirmación de comandos enviados al reloj
 *
 * IMPORTANTE: estos endpoints NO llevan el prefijo /api (excluido en main.ts).
 * Todos responden Content-Type: text/plain — el reloj no entiende JSON.
 */
let AdmsController = AdmsController_1 = class AdmsController {
    constructor(adms) {
        this.adms = adms;
        this.logger = new common_1.Logger(AdmsController_1.name);
    }
    // ── GET /iclock/cdata — Handshake ──────────────────────────────────────────
    async handshake(query, req, res) {
        await this.logRequest(req, query, null);
        const sn = query['SN'] ?? query['sn'];
        this.logger.log(`[HANDSHAKE] SN=${sn}`);
        const body = this.adms.buildHandshakeResponse(sn);
        res.setHeader('Content-Type', 'text/plain');
        res.send(body);
    }
    // ── POST /iclock/cdata — Fichajes ──────────────────────────────────────────
    async receivePunches(query, req, res) {
        const rawBody = this.getRawBody(req);
        await this.logRequest(req, query, rawBody);
        const sn = query['SN'] ?? query['sn'];
        this.logger.log(`[PUNCHES] SN=${sn} | ${rawBody?.length ?? 0} bytes`);
        if (rawBody) {
            try {
                const saved = await this.adms.processPunchPayload(rawBody, sn);
                this.logger.log(`[PUNCHES] Guardados: ${saved} fichajes`);
            }
            catch (err) {
                this.logger.error(`[PUNCHES] Error al procesar payload: ${err.message}`);
            }
        }
        res.setHeader('Content-Type', 'text/plain');
        res.send('OK');
    }
    // ── GET /iclock/getrequest — Heartbeat ────────────────────────────────────
    async heartbeat(query, req, res) {
        await this.logRequest(req, query, null);
        const sn = query['SN'] ?? query['sn'];
        this.logger.debug(`[HEARTBEAT] SN=${sn}`);
        res.setHeader('Content-Type', 'text/plain');
        res.send('OK');
    }
    // ── POST /iclock/devicecmd — Confirmación de comandos ─────────────────────
    async deviceCmd(query, req, res) {
        const rawBody = this.getRawBody(req);
        await this.logRequest(req, query, rawBody);
        const sn = query['SN'] ?? query['sn'];
        this.logger.debug(`[DEVICECMD] SN=${sn}`);
        res.setHeader('Content-Type', 'text/plain');
        res.send('OK');
    }
    // ── Helpers ────────────────────────────────────────────────────────────────
    getRawBody(req) {
        const raw = req.rawBody;
        if (!raw)
            return null;
        if (Buffer.isBuffer(raw))
            return raw.toString('utf-8');
        if (typeof raw === 'string')
            return raw;
        return null;
    }
    async logRequest(req, query, body) {
        const ip = req.ip ?? req.socket?.remoteAddress ?? null;
        const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : (v ?? '')]));
        try {
            await this.adms.saveRawLog({
                method: req.method,
                path: req.path,
                headers,
                queryParams: query,
                bodyRaw: body,
                ip,
            });
        }
        catch (err) {
            this.logger.warn(`No se pudo guardar raw log: ${err.message}`);
        }
    }
};
exports.AdmsController = AdmsController;
__decorate([
    (0, common_1.Get)('cdata'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdmsController.prototype, "handshake", null);
__decorate([
    (0, common_1.Post)('cdata'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdmsController.prototype, "receivePunches", null);
__decorate([
    (0, common_1.Get)('getrequest'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdmsController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)('devicecmd'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdmsController.prototype, "deviceCmd", null);
exports.AdmsController = AdmsController = AdmsController_1 = __decorate([
    (0, common_1.Controller)('iclock'),
    __metadata("design:paramtypes", [adms_service_1.AdmsService])
], AdmsController);
//# sourceMappingURL=adms.controller.js.map