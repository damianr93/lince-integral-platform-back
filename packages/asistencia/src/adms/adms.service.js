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
var AdmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const raw_log_entity_1 = require("../entities/raw-log.entity");
const fichaje_entity_1 = require("../entities/fichaje.entity");
const empleado_entity_1 = require("../entities/empleado.entity");
let AdmsService = AdmsService_1 = class AdmsService {
    constructor(config, rawLogRepo, fichajeRepo, empleadoRepo) {
        this.config = config;
        this.rawLogRepo = rawLogRepo;
        this.fichajeRepo = fichajeRepo;
        this.empleadoRepo = empleadoRepo;
        this.logger = new common_1.Logger(AdmsService_1.name);
        const snTucuman = this.config.get('DEVICE_SN_TUCUMAN') ?? '';
        const snVillaNueva = this.config.get('DEVICE_SN_VILLA_NUEVA') ?? '';
        this.devicePlantMap = {};
        if (snTucuman)
            this.devicePlantMap[snTucuman] = empleado_entity_1.Planta.TUCUMAN;
        if (snVillaNueva)
            this.devicePlantMap[snVillaNueva] = empleado_entity_1.Planta.VILLA_NUEVA;
        this.logger.log(`Device→Planta map: ${JSON.stringify(this.devicePlantMap)}`);
    }
    // ── Raw logging ────────────────────────────────────────────────────────────
    async saveRawLog(data) {
        const deviceSn = data.queryParams['SN'] ?? data.queryParams['sn'] ?? null;
        let bodyParsed = null;
        if (data.bodyRaw) {
            try {
                bodyParsed = JSON.parse(data.bodyRaw);
            }
            catch {
                bodyParsed = this.parseAdmsBody(data.bodyRaw);
            }
        }
        await this.rawLogRepo.save(this.rawLogRepo.create({
            method: data.method,
            path: data.path,
            headers: data.headers,
            queryParams: data.queryParams,
            bodyRaw: data.bodyRaw,
            bodyParsed,
            deviceSn,
            ip: data.ip,
        }));
    }
    // ── ADMS handshake ─────────────────────────────────────────────────────────
    buildHandshakeResponse(sn) {
        const plant = sn ? this.devicePlantMap[sn] : undefined;
        this.logger.log(`Handshake recibido — SN: ${sn ?? 'desconocido'}, planta: ${plant ?? 'no mapeada'}`);
        return [
            'OK',
            'Realtime=1',
            'Stamp=9999',
            'OpStamp=9999',
            'ErrorDelay=30',
            'Delay=10',
            'TransTimes=00:00;14:05',
            'TransInterval=1',
            'TimeZone=0',
            'ServerVer=2.4.1 2015-01-13',
            'PushProtVer=2.4.1',
        ].join('\n');
    }
    // ── Procesamiento de fichajes ──────────────────────────────────────────────
    async processPunchPayload(body, sn) {
        const planta = sn ? (this.devicePlantMap[sn] ?? null) : null;
        const punches = this.parsePunchLines(body);
        if (punches.length === 0) {
            this.logger.debug(`Sin fichajes en payload — SN: ${sn}`);
            return 0;
        }
        this.logger.log(`Procesando ${punches.length} fichaje(s) — SN: ${sn}, planta: ${planta}`);
        let saved = 0;
        for (const punch of punches) {
            const isDuplicate = await this.isDuplicate(punch.pin, punch.time);
            if (isDuplicate) {
                this.logger.debug(`Duplicado ignorado — PIN: ${punch.pin}, tiempo: ${punch.time.toISOString()}`);
                continue;
            }
            const empleado = await this.empleadoRepo.findOne({ where: { pin: punch.pin } });
            await this.fichajeRepo.save(this.fichajeRepo.create({
                pin: punch.pin,
                tiempo: punch.time,
                estado: punch.status,
                verify: punch.verify,
                deviceSn: sn ?? null,
                planta,
                empleadoId: empleado?.id ?? null,
                rawPayload: body,
            }));
            saved++;
        }
        this.logger.log(`Guardados ${saved}/${punches.length} fichajes (${punches.length - saved} duplicados)`);
        return saved;
    }
    async simulatePunch(pin, status, deviceSn) {
        const planta = this.devicePlantMap[deviceSn] ?? null;
        const empleado = await this.empleadoRepo.findOne({ where: { pin } });
        const tiempo = new Date();
        return this.fichajeRepo.save(this.fichajeRepo.create({
            pin,
            tiempo,
            estado: status,
            verify: null,
            deviceSn,
            planta,
            empleadoId: empleado?.id ?? null,
            rawPayload: `SIMULATE PIN=${pin} Status=${status} DevSn=${deviceSn}`,
        }));
    }
    // ── Parsers internos ───────────────────────────────────────────────────────
    /**
     * Parsea las líneas de fichaje del protocolo ADMS.
     * Formato esperado (cada línea es un fichaje):
     *   ATTLOG\t<PIN>\t<YYYY-MM-DD HH:mm:ss>\t<Status>\t<Verify>\t...
     * También soporta formato sin prefijo ATTLOG, solo campos separados por tab o espacio.
     */
    parsePunchLines(body) {
        const punches = [];
        const lines = body.split(/\r?\n/).filter((l) => l.trim().length > 0);
        for (const line of lines) {
            try {
                const punch = this.parseSingleLine(line);
                if (punch)
                    punches.push(punch);
            }
            catch (err) {
                this.logger.warn(`No se pudo parsear línea: "${line}" — ${err.message}`);
            }
        }
        return punches;
    }
    parseSingleLine(line) {
        const trimmed = line.trim();
        // Ignorar cabeceras del protocolo
        if (trimmed.startsWith('ATTLOG') && !trimmed.includes('\t') ||
            trimmed === 'ATTLOG' ||
            trimmed.startsWith('OPLOG') ||
            trimmed.startsWith('ERRORLOG') ||
            trimmed.startsWith('Table=') ||
            trimmed.startsWith('SN=') ||
            trimmed.startsWith('USER') ||
            trimmed.startsWith('FP') ||
            trimmed === 'OK') {
            return null;
        }
        // Formato: "ATTLOG\tPIN\tYYYY-MM-DD HH:mm:ss\tStatus\tVerify\t..."
        const withPrefix = /^ATTLOG\s+(.+)$/i.exec(trimmed);
        const dataLine = withPrefix ? withPrefix[1] : trimmed;
        // Separar por tab o múltiples espacios
        const parts = dataLine.split(/\t| {2,}/).map((p) => p.trim()).filter(Boolean);
        if (parts.length < 3)
            return null;
        const pin = parts[0];
        const timeStr = parts[1];
        const status = parseInt(parts[2] ?? '0', 10);
        const verify = parts[3] ? parseInt(parts[3], 10) : null;
        const time = new Date(timeStr);
        if (isNaN(time.getTime())) {
            this.logger.warn(`Fecha inválida: "${timeStr}"`);
            return null;
        }
        return { pin, time, status, verify };
    }
    /**
     * Intenta parsear el body ADMS como objeto clave=valor para el raw log.
     * Soporta tanto líneas separadas (\n) como tabs (\t).
     */
    parseAdmsBody(raw) {
        const result = { _raw: raw };
        const lines = raw.split(/\r?\n/).filter(Boolean);
        result['_lines'] = lines.length;
        const kvPairs = {};
        for (const line of lines) {
            const parts = line.split('\t');
            if (parts.length > 1) {
                kvPairs[`line_${lines.indexOf(line)}`] = line;
            }
            else if (line.includes('=')) {
                const [key, ...rest] = line.split('=');
                if (key)
                    kvPairs[key.trim()] = rest.join('=').trim();
            }
        }
        return { ...result, ...kvPairs };
    }
    async isDuplicate(pin, time) {
        const windowStart = new Date(time.getTime() - 30 * 1000);
        const windowEnd = new Date(time.getTime() + 30 * 1000);
        const count = await this.fichajeRepo
            .createQueryBuilder('f')
            .where('f.pin = :pin', { pin })
            .andWhere('f.tiempo BETWEEN :start AND :end', { start: windowStart, end: windowEnd })
            .getCount();
        return count > 0;
    }
};
exports.AdmsService = AdmsService;
exports.AdmsService = AdmsService = AdmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(raw_log_entity_1.RawLogEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(fichaje_entity_1.FichajeEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(empleado_entity_1.EmpleadoEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdmsService);
//# sourceMappingURL=adms.service.js.map