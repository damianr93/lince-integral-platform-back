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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const follow_up_events_service_1 = require("../follow-up/follow-up-events.service");
const geo_service_1 = require("../geo/geo.service");
const PDFDocument = require("pdfkit");
let AnalyticsService = class AnalyticsService {
    constructor(clientModel, followUpEventsService, geoService) {
        this.clientModel = clientModel;
        this.followUpEventsService = followUpEventsService;
        this.geoService = geoService;
        this.normalizationBatchSize = 80;
        this.normalizationConcurrency = 2;
        this.normalizationMaxBatches = 10;
        this.geoFailureCache = new Map();
        this.geoFailureTtlMs = 1000 * 60 * 60 * 12;
    }
    getYearDateRange(year) {
        return {
            start: new Date(`${year}-01-01T00:00:00.000Z`),
            end: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        };
    }
    buildCreatedAtMatchForYear(year) {
        if (!year) {
            return {};
        }
        const { start, end } = this.getYearDateRange(year);
        return {
            createdAt: {
                $gte: start,
                $lt: end,
            },
        };
    }
    buildLocationDateMatch(filters) {
        if (filters.startDate || filters.endDate) {
            const createdAt = {};
            if (filters.startDate) {
                createdAt.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                createdAt.$lte = new Date(filters.endDate);
            }
            return { createdAt };
        }
        if (filters.year) {
            const { start, end } = this.getYearDateRange(filters.year);
            return {
                createdAt: {
                    $gte: start,
                    $lt: end,
                },
            };
        }
        return {};
    }
    /**
     * Devuelve:
     *  - totalContacts: numero total de documentos en la coleccion clients
     *  - totalReconsultas: cantidad de registros marcados como reconsulta
     *  - firstTimeContacts: contactos unicos sin reconsulta
     *  - byChannel: arreglo de { channel, total }, agrupado por medioAdquisicion
     */
    async totales(year) {
        try {
            const createdAtMatch = this.buildCreatedAtMatchForYear(year);
            const [totalContacts, totalReconsultas, aggregation] = await Promise.all([
                this.clientModel.countDocuments(createdAtMatch).exec(),
                this.clientModel.countDocuments({ ...createdAtMatch, isReconsulta: true }).exec(),
                this.clientModel
                    .aggregate([
                    ...(Object.keys(createdAtMatch).length > 0
                        ? [{ $match: createdAtMatch }]
                        : []),
                    {
                        $group: {
                            _id: '$medioAdquisicion',
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { count: -1 },
                    },
                ])
                    .exec(),
            ]);
            const firstTimeContacts = Math.max(totalContacts - totalReconsultas, 0);
            const byChannel = aggregation.map((entry) => ({
                channel: entry._id || 'OTRO',
                total: entry.count,
            }));
            return { totalContacts, totalReconsultas, firstTimeContacts, byChannel };
        }
        catch (err) {
            console.error('Error en AnalyticsService.totales:', err);
            throw new common_1.InternalServerErrorException('Error al obtener totales de clientes');
        }
    }
    /**
     * Retorna un arreglo de { date: "YYYY-MM", total },
     * contando cuántos clientes se crearon en cada mes del año.
     */
    async evolution(year) {
        try {
            const targetYear = year ?? new Date().getFullYear();
            const { start: startOfYear, end: endOfYear } = this.getYearDateRange(targetYear);
            const pipeline = [
                {
                    $match: {
                        createdAt: {
                            $gte: startOfYear,
                            $lt: endOfYear,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 },
                },
                {
                    $project: {
                        _id: 0,
                        date: {
                            $concat: [
                                { $toString: '$_id.year' },
                                '-',
                                {
                                    $cond: [
                                        { $lt: ['$_id.month', 10] },
                                        { $concat: ['0', { $toString: '$_id.month' }] },
                                        { $toString: '$_id.month' },
                                    ],
                                },
                            ],
                        },
                        total: '$count',
                    },
                },
            ];
            const result = await this.clientModel
                .aggregate(pipeline)
                .exec();
            const byMonth = new Map();
            result.forEach((item) => byMonth.set(item.date, item.total));
            const points = [];
            for (let month = 1; month <= 12; month += 1) {
                const monthLabel = `${targetYear}-${month.toString().padStart(2, '0')}`;
                points.push({
                    date: monthLabel,
                    total: byMonth.get(monthLabel) ?? 0,
                });
            }
            return points;
        }
        catch (err) {
            console.error('Error en AnalyticsService.evolution:', err);
            throw new common_1.InternalServerErrorException('Error al obtener evolución de clientes');
        }
    }
    async yearlyComparison(years) {
        try {
            const selectedYears = years.length > 0 ? years : [new Date().getFullYear() - 1, new Date().getFullYear()];
            const startYear = Math.min(...selectedYears);
            const endYear = Math.max(...selectedYears);
            const { start } = this.getYearDateRange(startYear);
            const { end } = this.getYearDateRange(endYear);
            const aggregation = await this.clientModel
                .aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: start,
                            $lt: end,
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
            ])
                .exec();
            const totals = new Map();
            aggregation.forEach((item) => {
                const year = item._id.year;
                if (!selectedYears.includes(year)) {
                    return;
                }
                const key = `${year}-${item._id.month}`;
                totals.set(key, item.count);
            });
            const comparison = [];
            for (let month = 1; month <= 12; month += 1) {
                const row = {
                    month: month.toString().padStart(2, '0'),
                };
                selectedYears.forEach((year) => {
                    const key = `y${year}`;
                    row[key] = totals.get(`${year}-${month}`) ?? 0;
                });
                comparison.push(row);
            }
            return comparison;
        }
        catch (err) {
            console.error('Error en AnalyticsService.yearlyComparison:', err);
            throw new common_1.InternalServerErrorException('Error al obtener comparación anual');
        }
    }
    /**
     * Retorna un arreglo de los productos más consultados/comprados:
     *  { product, total } ordenado de mayor a menor en base a la cuenta de clientes asociados a cada producto.
     */
    async demandOfProduct(year) {
        try {
            const createdAtMatch = this.buildCreatedAtMatchForYear(year);
            const aggregation = await this.clientModel
                .aggregate([
                ...(Object.keys(createdAtMatch).length > 0
                    ? [{ $match: createdAtMatch }]
                    : []),
                {
                    $group: {
                        _id: '$producto',
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $limit: 10,
                },
            ])
                .exec();
            const result = aggregation.map((entry) => ({
                product: entry._id || 'Desconocido',
                total: entry.count,
            }));
            return result;
        }
        catch (err) {
            console.error('Error en AnalyticsService.demandOfProduct:', err);
            throw new common_1.InternalServerErrorException('Error al obtener demanda de productos');
        }
    }
    async purchaseStatus(year) {
        try {
            const createdAtMatch = this.buildCreatedAtMatchForYear(year);
            const aggregation = await this.clientModel
                .aggregate([
                ...(Object.keys(createdAtMatch).length > 0
                    ? [{ $match: createdAtMatch }]
                    : []),
                {
                    $group: {
                        _id: '$estado',
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
            ])
                .exec();
            const totalClients = await this.clientModel.countDocuments(createdAtMatch).exec();
            const statusMap = {
                'COMPRO': 'Compras',
                'NO_COMPRO': 'No Compras',
                'PENDIENTE': 'Pendientes',
            };
            const statusCount = {
                'Compras': 0,
                'No Compras': 0,
                'Pendientes': 0,
            };
            aggregation.forEach((entry) => {
                const normalizedStatus = statusMap[entry._id] || 'Pendientes';
                statusCount[normalizedStatus] += entry.count;
            });
            const result = Object.entries(statusCount).map(([status, total]) => ({
                status,
                total,
                percentage: totalClients > 0 ? Math.round((total / totalClients) * 100) : 0,
            }));
            return result;
        }
        catch (err) {
            console.error('Error en AnalyticsService.purchaseStatus:', err);
            throw new common_1.InternalServerErrorException('Error al obtener estado de compras');
        }
    }
    async followUpEvents(assignedTo, statusesParam) {
        try {
            let statuses = ['READY'];
            if (statusesParam) {
                const parsed = statusesParam
                    .split(',')
                    .map((status) => status.trim().toUpperCase())
                    .filter((status) => ['READY', 'COMPLETED', 'CANCELLED', 'SCHEDULED'].includes(status));
                if (parsed.length > 0) {
                    statuses = parsed;
                }
            }
            const events = await this.followUpEventsService.getEventsByStatus(statuses, 100, assignedTo);
            return events.map((event) => ({
                id: event._id.toString(),
                customerName: event.customerName,
                customerLastName: event.customerLastName,
                assignedTo: event.assignedTo,
                customerPhone: event.customerPhone,
                product: event.product,
                triggerStatus: event.triggerStatus,
                templateId: event.templateId,
                message: event.message,
                channels: event.channels,
                contactValue: event.contactValue ?? null,
                scheduledFor: new Date(event.scheduledFor).toISOString(),
                status: event.status,
                readyAt: event.readyAt ? new Date(event.readyAt).toISOString() : null,
                createdAt: event.createdAt
                    ? new Date(event.createdAt).toISOString()
                    : new Date(event.scheduledFor).toISOString(),
                completedAt: event.completedAt ? new Date(event.completedAt).toISOString() : null,
                notes: event.notes ?? null,
            }));
        }
        catch (err) {
            console.error('Error en AnalyticsService.followUpEvents:', err);
            throw new common_1.InternalServerErrorException('Error al obtener eventos de seguimiento');
        }
    }
    async locationSummary(filters) {
        try {
            // Ejecutar normalización en background sin bloquear la respuesta
            this.ensureNormalizedLocations(filters).catch((err) => {
                console.error('Error normalizando ubicaciones en background:', err);
            });
            const report = await this.buildLocationReport(filters);
            const total = report.total;
            const topProvinceMap = new Map();
            report.countries.forEach((country) => {
                country.provinces.forEach((province) => {
                    const normalized = this.normalizeProvinceKey(province.name);
                    if (!normalized || normalized.startsWith('sin ')) {
                        return;
                    }
                    const existing = topProvinceMap.get(normalized);
                    if (existing) {
                        existing.total += province.total;
                        existing.percentage = total > 0 ? Math.round((existing.total / total) * 100) : 0;
                        if (province.name.length > existing.name.length) {
                            existing.name = province.name;
                        }
                    }
                    else {
                        topProvinceMap.set(normalized, {
                            name: province.name,
                            total: province.total,
                            percentage: total > 0 ? Math.round((province.total / total) * 100) : 0,
                        });
                    }
                });
            });
            const topProvinces = Array.from(topProvinceMap.values())
                .sort((a, b) => b.total - a.total)
                .slice(0, 6);
            const topLocalities = report.countries
                .flatMap((country) => country.provinces.flatMap((province) => province.localities.map((locality) => ({
                name: locality.name,
                province: province.name,
                total: locality.total,
                percentage: total > 0 ? Math.round((locality.total / total) * 100) : 0,
            }))))
                .sort((a, b) => b.total - a.total)
                .slice(0, 6);
            const mapPoints = await this.getMapPoints(report, filters);
            return {
                total,
                noLocation: report.noLocation,
                topProvinces,
                topLocalities,
                mapPoints,
            };
        }
        catch (err) {
            console.error('Error en AnalyticsService.locationSummary:', err);
            throw new common_1.InternalServerErrorException('Error al obtener resumen de ubicaciones');
        }
    }
    async locationHeatmap(filters) {
        try {
            // Ejecutar normalización en background sin bloquear la respuesta
            this.ensureNormalizedLocations(filters).catch((err) => {
                console.error('Error normalizando ubicaciones en background:', err);
            });
            const report = await this.buildLocationReport(filters);
            const provinces = this.buildHeatmapProvinces(report);
            return { total: report.total, provinces };
        }
        catch (err) {
            console.error('Error en AnalyticsService.locationHeatmap:', err);
            throw new common_1.InternalServerErrorException('Error al obtener mapa de calor');
        }
    }
    async locationReportPdf(filters) {
        // Ejecutar normalización en background sin bloquear la generación del PDF
        this.ensureNormalizedLocations(filters).catch((err) => {
            console.error('Error normalizando ubicaciones en background:', err);
        });
        const report = await this.buildLocationReport(filters);
        const clients = await this.findClientsForReport(filters);
        return this.generateLocationPdf(report, clients, filters);
    }
    async locationDebug(filters) {
        const report = await this.buildLocationReport(filters);
        const mapPoints = await this.getMapPoints(report, filters);
        const provinces = report.countries.flatMap((country) => country.provinces.map((province) => ({
            name: province.name,
            total: province.total,
        })));
        return {
            reportTotal: report.total,
            noLocation: report.noLocation,
            topProvinces: provinces.slice(0, 10),
            mapPoints,
        };
    }
    async locationMapImage(filters) {
        try {
            const report = await this.buildLocationReport(filters);
            const points = await this.getMapPoints(report, filters);
            const defaultCenter = { lat: -38.4161, lon: -63.6167 };
            const center = points[0] ?? defaultCenter;
            const markers = points.length
                ? points
                    .slice(0, 8)
                    .map((point) => `${point.lat},${point.lon},lightblue1`)
                    .join('|')
                : '';
            const markerParam = markers ? `&markers=${encodeURIComponent(markers)}` : '';
            const url = `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lon}&zoom=4&size=800x440&maptype=mapnik${markerParam}`;
            const response = await fetch(url);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                return { buffer: Buffer.from(arrayBuffer), contentType: 'image/png' };
            }
            const svg = this.buildSvgMap(points, center);
            return { buffer: Buffer.from(svg), contentType: 'image/svg+xml' };
        }
        catch (_error) {
            const fallbackCenter = { lat: -38.4161, lon: -63.6167 };
            const svg = this.buildSvgMap([], fallbackCenter);
            return { buffer: Buffer.from(svg), contentType: 'image/svg+xml' };
        }
    }
    buildSvgMap(points, center) {
        const width = 800;
        const height = 440;
        const latMin = -55;
        const latMax = -22;
        const lonMin = -73;
        const lonMax = -53;
        const project = (lat, lon) => {
            const x = ((lon - lonMin) / (lonMax - lonMin)) * width;
            const y = height - ((lat - latMin) / (latMax - latMin)) * height;
            return { x, y };
        };
        const maxTotal = Math.max(...points.map((p) => p.total), 1);
        const circles = points
            .map((point) => {
            const { x, y } = project(point.lat, point.lon);
            const radius = 4 + Math.round((point.total / maxTotal) * 8);
            return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="#38BDF8" stroke="#0F172A" stroke-width="1" />`;
        })
            .join('');
        const centerPoint = project(center.lat, center.lon);
        return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#0F172A"/>
            <stop offset="100%" stop-color="#111827"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)" />
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="#0B1220" stroke="#1F2937" stroke-width="2" rx="16" />
        <text x="40" y="60" fill="#FBBF24" font-size="16" font-family="Arial">Mapa de Consultas (Argentina)</text>
        <text x="40" y="85" fill="#94A3B8" font-size="11" font-family="Arial">Centros provinciales y puntos de demanda</text>
        ${circles}
        <circle cx="${centerPoint.x.toFixed(1)}" cy="${centerPoint.y.toFixed(1)}" r="4" fill="#FBBF24" />
      </svg>
    `;
    }
    async buildLocationReport(filters) {
        return this.buildLocationAggregations(filters);
    }
    async buildLocationAggregations(filters) {
        const matchDate = this.buildLocationDateMatch(filters);
        const invalidTokens = [
            '-',
            'null',
            'undefined',
            'sin datos',
            'sin informacion',
            'sin información',
            'no disponible',
            'n/a',
            'na',
            'sin localidad',
            'sin provincia',
            'sin pais',
            'sin país',
            'sin datos de ubicacion del cliente',
            'sin datos de ubicación del cliente',
        ];
        const buildCleanStringExpr = (path) => ({
            $let: {
                vars: {
                    raw: { $ifNull: [path, ''] },
                    trimmed: { $trim: { input: { $ifNull: [path, ''] } } },
                    lower: { $toLower: { $trim: { input: { $ifNull: [path, ''] } } } },
                },
                in: {
                    $cond: [
                        {
                            $or: [
                                { $eq: ['$$trimmed', ''] },
                                {
                                    $regexMatch: {
                                        input: '$$trimmed',
                                        regex: '{{|}}|cuf_',
                                        options: 'i',
                                    },
                                },
                                { $in: ['$$lower', invalidTokens] },
                            ],
                        },
                        null,
                        '$$trimmed',
                    ],
                },
            },
        });
        const normalizedLocationFlag = { $eq: ['$ubicacion.esNormalizada', true] };
        const resolvedProvince = {
            $cond: [normalizedLocationFlag, buildCleanStringExpr('$ubicacion.provincia'), null],
        };
        const resolvedLocality = {
            $cond: [normalizedLocationFlag, buildCleanStringExpr('$ubicacion.localidad'), null],
        };
        const resolvedCountry = { $literal: 'Argentina' };
        const resolvedZone = {
            $cond: [normalizedLocationFlag, buildCleanStringExpr('$ubicacion.zona'), null],
        };
        const resolvedProduct = {
            $ifNull: [buildCleanStringExpr('$producto'), 'Sin dato'],
        };
        const matchResolved = {};
        if (filters.provincias && filters.provincias.length > 0) {
            matchResolved.resolvedProvince = { $in: filters.provincias };
        }
        if (filters.paises && filters.paises.length > 0) {
            matchResolved.resolvedCountry = { $in: filters.paises };
        }
        if (filters.zonas && filters.zonas.length > 0) {
            matchResolved.resolvedZone = { $in: filters.zonas };
        }
        const pipeline = [
            Object.keys(matchDate).length > 0 ? { $match: matchDate } : { $match: {} },
            {
                $addFields: {
                    resolvedProvince,
                    resolvedLocality,
                    resolvedCountry,
                    resolvedZone,
                    resolvedProduct,
                },
            },
            {
                $addFields: {
                    hasLocation: {
                        $or: [
                            { $ne: ['$resolvedProvince', null] },
                            { $ne: ['$resolvedLocality', null] },
                            { $ne: ['$resolvedZone', null] },
                        ],
                    },
                },
            },
            Object.keys(matchResolved).length > 0 ? { $match: matchResolved } : { $match: {} },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                reconsultas: {
                                    $sum: { $cond: [{ $eq: ['$isReconsulta', true] }, 1, 0] },
                                },
                            },
                        },
                    ],
                    noLocation: [
                        { $match: { hasLocation: false } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                reconsultas: {
                                    $sum: { $cond: [{ $eq: ['$isReconsulta', true] }, 1, 0] },
                                },
                            },
                        },
                    ],
                    countries: [
                        { $match: { hasLocation: true } },
                        {
                            $group: {
                                _id: '$resolvedCountry',
                                total: { $sum: 1 },
                                reconsultas: {
                                    $sum: { $cond: [{ $eq: ['$isReconsulta', true] }, 1, 0] },
                                },
                            },
                        },
                        { $sort: { total: -1 } },
                    ],
                    provinces: [
                        { $match: { hasLocation: true } },
                        {
                            $group: {
                                _id: {
                                    country: '$resolvedCountry',
                                    province: '$resolvedProvince',
                                },
                                total: { $sum: 1 },
                                reconsultas: {
                                    $sum: { $cond: [{ $eq: ['$isReconsulta', true] }, 1, 0] },
                                },
                            },
                        },
                        { $sort: { total: -1 } },
                    ],
                    localities: [
                        { $match: { hasLocation: true } },
                        {
                            $group: {
                                _id: {
                                    country: '$resolvedCountry',
                                    province: '$resolvedProvince',
                                    locality: '$resolvedLocality',
                                },
                                total: { $sum: 1 },
                                reconsultas: {
                                    $sum: { $cond: [{ $eq: ['$isReconsulta', true] }, 1, 0] },
                                },
                            },
                        },
                        { $sort: { total: -1 } },
                    ],
                    topProductProvince: [
                        { $match: { hasLocation: true } },
                        {
                            $group: {
                                _id: {
                                    country: '$resolvedCountry',
                                    province: '$resolvedProvince',
                                    product: '$resolvedProduct',
                                },
                                total: { $sum: 1 },
                            },
                        },
                        { $sort: { total: -1 } },
                        {
                            $group: {
                                _id: {
                                    country: '$_id.country',
                                    province: '$_id.province',
                                },
                                product: { $first: '$_id.product' },
                                total: { $first: '$total' },
                            },
                        },
                    ],
                    topProductLocality: [
                        { $match: { hasLocation: true } },
                        {
                            $group: {
                                _id: {
                                    country: '$resolvedCountry',
                                    province: '$resolvedProvince',
                                    locality: '$resolvedLocality',
                                    product: '$resolvedProduct',
                                },
                                total: { $sum: 1 },
                            },
                        },
                        { $sort: { total: -1 } },
                        {
                            $group: {
                                _id: {
                                    country: '$_id.country',
                                    province: '$_id.province',
                                    locality: '$_id.locality',
                                },
                                product: { $first: '$_id.product' },
                                total: { $first: '$total' },
                            },
                        },
                    ],
                    topLocalitiesByProvince: [
                        { $match: { hasLocation: true } },
                        {
                            $group: {
                                _id: {
                                    country: '$resolvedCountry',
                                    province: '$resolvedProvince',
                                    locality: '$resolvedLocality',
                                },
                                total: { $sum: 1 },
                            },
                        },
                        { $sort: { total: -1 } },
                        {
                            $group: {
                                _id: { country: '$_id.country', province: '$_id.province' },
                                localities: {
                                    $push: {
                                        name: '$_id.locality',
                                        total: '$total',
                                    },
                                },
                            },
                        },
                        {
                            $project: {
                                localities: { $slice: ['$localities', 5] },
                            },
                        },
                    ],
                },
            },
        ];
        const [result] = await this.clientModel.aggregate(pipeline).exec();
        const totals = result?.totals?.[0] ?? { total: 0, reconsultas: 0 };
        const total = totals.total ?? 0;
        const totalReconsultas = totals.reconsultas ?? 0;
        const noLocation = result?.noLocation?.[0] ?? { total: 0, reconsultas: 0 };
        const noLocationTotal = noLocation.total ?? 0;
        const countriesRaw = result?.countries ?? [];
        const provincesRaw = result?.provinces ?? [];
        const localitiesRaw = result?.localities ?? [];
        const topProductProvinceRaw = result?.topProductProvince ?? [];
        const topProductLocalityRaw = result?.topProductLocality ?? [];
        const topLocalitiesByProvinceRaw = result?.topLocalitiesByProvince ?? [];
        const countryMap = new Map();
        const normalizedCountryName = (value) => value && value.trim().length > 0 ? value.trim() : 'País no informado';
        const normalizedProvinceName = (value) => value && value.trim().length > 0 ? value.trim() : null;
        const normalizedLocalityName = (value) => value && value.trim().length > 0 ? value.trim() : null;
        countriesRaw.forEach((country) => {
            const name = normalizedCountryName(country._id);
            countryMap.set(name, {
                name,
                total: country.total ?? 0,
                percentage: total > 0 ? Math.round((country.total / total) * 100) : 0,
                provinces: [],
            });
        });
        const provinceMap = new Map();
        provincesRaw.forEach((province) => {
            const countryName = normalizedCountryName(province._id?.country);
            const provinceName = normalizedProvinceName(province._id?.province);
            if (!provinceName) {
                return;
            }
            const key = `${countryName}::${provinceName}`;
            const provinceData = {
                name: provinceName,
                total: province.total ?? 0,
                percentage: total > 0 ? Math.round((province.total / total) * 100) : 0,
                reconsultas: province.reconsultas ?? 0,
                topProduct: undefined,
                topLocalities: [],
                localities: [],
            };
            provinceMap.set(key, provinceData);
            const countryEntry = countryMap.get(countryName) ??
                {
                    name: countryName,
                    total: 0,
                    percentage: 0,
                    provinces: [],
                };
            if (!countryMap.has(countryName)) {
                countryMap.set(countryName, countryEntry);
            }
            countryEntry.provinces.push(provinceData);
        });
        const localityMap = new Map();
        localitiesRaw.forEach((locality) => {
            const countryName = normalizedCountryName(locality._id?.country);
            const provinceName = normalizedProvinceName(locality._id?.province);
            const localityName = normalizedLocalityName(locality._id?.locality);
            if (!provinceName || !localityName) {
                return;
            }
            const key = `${countryName}::${provinceName}::${localityName}`;
            const localityData = {
                name: localityName,
                total: locality.total ?? 0,
                percentage: total > 0 ? Math.round((locality.total / total) * 100) : 0,
                reconsultas: locality.reconsultas ?? 0,
                topProduct: undefined,
            };
            localityMap.set(key, localityData);
            const provinceKey = `${countryName}::${provinceName}`;
            const provinceEntry = provinceMap.get(provinceKey);
            if (provinceEntry) {
                provinceEntry.localities.push(localityData);
            }
        });
        topProductProvinceRaw.forEach((entry) => {
            const countryName = normalizedCountryName(entry._id?.country);
            const provinceName = normalizedProvinceName(entry._id?.province);
            if (!provinceName) {
                return;
            }
            const provinceKey = `${countryName}::${provinceName}`;
            const provinceEntry = provinceMap.get(provinceKey);
            if (!provinceEntry) {
                return;
            }
            provinceEntry.topProduct = {
                name: entry.product ?? 'Sin dato',
                total: entry.total ?? 0,
                percentage: provinceEntry.total > 0 ? Math.round((entry.total / provinceEntry.total) * 100) : 0,
            };
        });
        topProductLocalityRaw.forEach((entry) => {
            const countryName = normalizedCountryName(entry._id?.country);
            const provinceName = normalizedProvinceName(entry._id?.province);
            const localityName = normalizedLocalityName(entry._id?.locality);
            if (!provinceName || !localityName) {
                return;
            }
            const localityKey = `${countryName}::${provinceName}::${localityName}`;
            const localityEntry = localityMap.get(localityKey);
            if (!localityEntry) {
                return;
            }
            localityEntry.topProduct = {
                name: entry.product ?? 'Sin dato',
                total: entry.total ?? 0,
                percentage: localityEntry.total > 0 ? Math.round((entry.total / localityEntry.total) * 100) : 0,
            };
        });
        topLocalitiesByProvinceRaw.forEach((entry) => {
            const countryName = normalizedCountryName(entry._id?.country);
            const provinceName = normalizedProvinceName(entry._id?.province);
            if (!provinceName) {
                return;
            }
            const provinceKey = `${countryName}::${provinceName}`;
            const provinceEntry = provinceMap.get(provinceKey);
            if (!provinceEntry) {
                return;
            }
            provinceEntry.topLocalities = (entry.localities ?? [])
                .map((loc) => ({
                name: normalizedLocalityName(loc.name),
                total: loc.total ?? 0,
                percentage: provinceEntry.total > 0
                    ? Math.round((loc.total / provinceEntry.total) * 100)
                    : 0,
            }))
                .filter((loc) => loc.name);
        });
        const countries = Array.from(countryMap.values())
            .sort((a, b) => b.total - a.total)
            .sort((a, b) => (a.name === 'País no informado' ? 1 : -1));
        countries.forEach((country) => {
            country.provinces.sort((a, b) => b.total - a.total);
            country.provinces.forEach((province) => {
                province.localities.sort((a, b) => b.total - a.total);
                province.localities.forEach((locality) => {
                    locality.percentage =
                        province.total > 0 ? Math.round((locality.total / province.total) * 100) : 0;
                });
            });
        });
        return {
            total,
            totalReconsultas,
            noLocation: {
                total: noLocationTotal,
                percentage: total > 0 ? Math.round((noLocationTotal / total) * 100) : 0,
                reconsultas: noLocation.reconsultas ?? 0,
            },
            countries,
        };
    }
    async getMapPoints(report, filters) {
        const matchDate = this.buildLocationDateMatch(filters);
        const matchResolved = {};
        if (filters.provincias && filters.provincias.length > 0) {
            matchResolved['ubicacion.provincia'] = { $in: filters.provincias };
        }
        if (filters.paises && filters.paises.length > 0) {
            matchResolved['ubicacion.pais'] = { $in: filters.paises };
        }
        if (filters.zonas && filters.zonas.length > 0) {
            matchResolved['ubicacion.zona'] = { $in: filters.zonas };
        }
        const pipeline = [
            Object.keys(matchDate).length > 0 ? { $match: matchDate } : { $match: {} },
            Object.keys(matchResolved).length > 0 ? { $match: matchResolved } : { $match: {} },
            {
                $match: {
                    'ubicacion.lat': { $ne: null },
                    'ubicacion.lon': { $ne: null },
                },
            },
            {
                $group: {
                    _id: {
                        name: { $ifNull: ['$ubicacion.localidad', '$ubicacion.provincia'] },
                        lat: '$ubicacion.lat',
                        lon: '$ubicacion.lon',
                    },
                    total: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    name: '$_id.name',
                    lat: '$_id.lat',
                    lon: '$_id.lon',
                    total: 1,
                },
            },
        ];
        const storedPoints = await this.clientModel.aggregate(pipeline).exec();
        if (storedPoints.length > 0) {
            return storedPoints;
        }
        const provinceFallback = this.buildProvinceFallbackMapPoints(report);
        if (provinceFallback.length > 0) {
            await this.persistProvinceFallbackPoints(provinceFallback);
            return provinceFallback;
        }
        return [];
    }
    buildProvinceFallbackMapPoints(report) {
        const centroids = {
            'buenos aires': { lat: -36.6769, lon: -60.5588 },
            'catamarca': { lat: -28.4696, lon: -65.7795 },
            'chaco': { lat: -26.3864, lon: -60.7658 },
            'chubut': { lat: -43.2934, lon: -65.1115 },
            'cordoba': { lat: -31.4201, lon: -64.1888 },
            'corrientes': { lat: -27.4692, lon: -58.8306 },
            'entre rios': { lat: -31.7431, lon: -60.5171 },
            'formosa': { lat: -26.1775, lon: -58.1781 },
            'jujuy': { lat: -24.1858, lon: -65.2995 },
            'la pampa': { lat: -37.1315, lon: -64.5943 },
            'la rioja': { lat: -29.4131, lon: -66.8568 },
            'mendoza': { lat: -32.8908, lon: -68.8272 },
            'misiones': { lat: -27.3671, lon: -55.8961 },
            'neuquen': { lat: -38.9516, lon: -68.0591 },
            'rio negro': { lat: -40.8261, lon: -63.0266 },
            'salta': { lat: -24.7821, lon: -65.4232 },
            'san juan': { lat: -31.5375, lon: -68.5364 },
            'san luis': { lat: -33.3017, lon: -66.3378 },
            'santa cruz': { lat: -51.6333, lon: -69.2167 },
            'santa fe': { lat: -31.6333, lon: -60.7000 },
            'santiago del estero': { lat: -27.7844, lon: -64.2673 },
            'tierra del fuego': { lat: -54.8019, lon: -68.3030 },
            'tucuman': { lat: -26.8083, lon: -65.2176 },
            'caba': { lat: -34.6037, lon: -58.3816 },
            'ciudad autonoma de buenos aires': { lat: -34.6037, lon: -58.3816 },
        };
        const provinces = report.countries
            .flatMap((country) => country.provinces)
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
        return provinces
            .map((province) => {
            const key = this.normalizeProvinceKey(province.name);
            const coords = centroids[key];
            if (!coords) {
                return null;
            }
            return {
                name: province.name,
                lat: coords.lat,
                lon: coords.lon,
                total: province.total,
            };
        })
            .filter((item) => !!item);
    }
    normalizeProvinceKey(value) {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\bprovincia\s+de\s+/g, '')
            .replace(/\bprovincia\s+/g, '')
            .replace(/\bprov\.?\s+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    async persistProvinceFallbackPoints(points) {
        await Promise.all(points.map(async (point) => {
            const regex = this.buildDiacriticRegex(point.name, false);
            await this.clientModel.updateMany({
                $and: [
                    {
                        $or: [
                            { 'ubicacion.provincia': { $regex: regex } },
                            { provincia: { $regex: regex } },
                        ],
                    },
                    {
                        $or: [
                            { 'ubicacion.lat': { $exists: false } },
                            { 'ubicacion.lat': null },
                        ],
                    },
                ],
            }, {
                $set: {
                    'ubicacion.lat': point.lat,
                    'ubicacion.lon': point.lon,
                    'ubicacion.fuente': 'PROVINCIA_CENTRO',
                    'ubicacion.esNormalizada': false,
                },
            });
        }));
    }
    buildDiacriticRegex(value, strict = true) {
        const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const map = {
            a: '[aáàäâã]',
            e: '[eéèëê]',
            i: '[iíìïî]',
            o: '[oóòöôõ]',
            u: '[uúùüû]',
            n: '[nñ]',
            c: '[cç]',
        };
        const pattern = escape(value)
            .split('')
            .map((char) => {
            const lower = char.toLowerCase();
            return map[lower] ?? escape(char);
        })
            .join('');
        return strict ? new RegExp(`^\\s*${pattern}\\s*$`, 'i') : new RegExp(pattern, 'i');
    }
    async findClientsForReport(filters) {
        const query = {};
        Object.assign(query, this.buildLocationDateMatch(filters));
        if (filters.provincias && filters.provincias.length > 0) {
            query['ubicacion.esNormalizada'] = true;
            query['ubicacion.provincia'] = { $in: filters.provincias };
        }
        if (filters.paises && filters.paises.length > 0) {
            query['ubicacion.esNormalizada'] = true;
            query['ubicacion.pais'] = { $in: filters.paises };
        }
        if (filters.zonas && filters.zonas.length > 0) {
            query['ubicacion.esNormalizada'] = true;
            query['ubicacion.zona'] = { $in: filters.zonas };
        }
        return this.clientModel.find(query).lean();
    }
    async generateLocationPdf(report, clients, filters) {
        const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        const title = 'Reporte de Clientes por Ubicación';
        this.drawSectionHeader(doc, title);
        doc.fontSize(10).fillColor('#6B7280').text('Generado: ' + new Date().toLocaleString('es-AR'));
        doc.moveDown(0.4);
        const filtersLabel = [
            filters.startDate ? `Desde: ${filters.startDate}` : null,
            filters.endDate ? `Hasta: ${filters.endDate}` : null,
            filters.provincias && filters.provincias.length > 0
                ? `Provincias: ${filters.provincias.join(', ')}`
                : null,
            filters.paises && filters.paises.length > 0 ? `Países: ${filters.paises.join(', ')}` : null,
            filters.zonas && filters.zonas.length > 0 ? `Zonas: ${filters.zonas.join(', ')}` : null,
        ]
            .filter(Boolean)
            .join(' | ');
        if (filtersLabel) {
            doc.fontSize(10).fillColor('#374151').text(filtersLabel);
            doc.moveDown(0.4);
        }
        const summaryRows = [
            ['Total de consultas', String(report.total)],
            ['Reconsultas', String(report.totalReconsultas)],
            [
                'Sin datos de ubicación',
                `${report.noLocation.total} (${report.noLocation.percentage}%)`,
            ],
        ];
        this.drawSimpleTable(doc, 'Resumen general', ['Métrica', 'Valor'], summaryRows, [0.55, 0.45]);
        const topProvinceMap = new Map();
        report.countries.forEach((country) => {
            country.provinces.forEach((province) => {
                const normalized = this.normalizeProvinceKey(province.name);
                if (!normalized || normalized.startsWith('sin ')) {
                    return;
                }
                const existing = topProvinceMap.get(normalized);
                if (existing) {
                    existing.total += province.total;
                    existing.percentage =
                        report.total > 0 ? Math.round((existing.total / report.total) * 100) : 0;
                    if (province.name.length > existing.name.length) {
                        existing.name = province.name;
                    }
                }
                else {
                    topProvinceMap.set(normalized, {
                        name: province.name,
                        total: province.total,
                        percentage: report.total > 0 ? Math.round((province.total / report.total) * 100) : 0,
                    });
                }
            });
        });
        const topProvinces = Array.from(topProvinceMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);
        if (topProvinces.length > 0) {
            const rows = topProvinces.map((item) => [
                item.name,
                String(item.total),
                `${item.percentage}%`,
            ]);
            this.drawSimpleTable(doc, 'Top provincias por consultas', ['Provincia', 'Consultas', '% del total'], rows, [0.6, 0.2, 0.2]);
        }
        const topProducts = report.countries
            .flatMap((country) => country.provinces
            .map((province) => province.topProduct)
            .filter((product) => !!product))
            .reduce((acc, product) => {
            acc[product.name] = (acc[product.name] ?? 0) + product.total;
            return acc;
        }, {});
        const topProductsData = Object.entries(topProducts)
            .map(([name, total]) => ({
            name,
            total,
            percentage: report.total > 0 ? Math.round((total / report.total) * 100) : 0,
        }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);
        if (topProductsData.length > 0) {
            const rows = topProductsData.map((item) => [
                item.name,
                String(item.total),
                `${item.percentage}%`,
            ]);
            this.drawSimpleTable(doc, 'Productos más pedidos (global)', ['Producto', 'Consultas', '% del total'], rows, [0.65, 0.2, 0.15]);
        }
        const provinces = report.countries.flatMap((country) => country.provinces);
        provinces.forEach((province) => {
            doc.addPage();
            this.drawSectionHeader(doc, `Provincia: ${province.name}`);
            const provinceRows = [
                ['Consultas', `${province.total} (${province.percentage}%)`],
                ['Reconsultas', String(province.reconsultas)],
                [
                    'Producto más pedido',
                    province.topProduct
                        ? `${province.topProduct.name} (${province.topProduct.total} | ${province.topProduct.percentage}%)`
                        : 'Sin dato',
                ],
            ];
            this.drawSimpleTable(doc, 'Resumen de provincia', ['Métrica', 'Valor'], provinceRows, [0.35, 0.65]);
            if (province.topLocalities.length > 0) {
                this.drawLocalityTable(doc, 'Localidades con más consultas', province.topLocalities);
            }
            doc.moveDown(0.4);
            this.renderClientTable(doc, clients.filter((client) => this.matchesProvince(client, province.name)));
            doc.moveDown(0.8);
        });
        if (report.noLocation.total > 0) {
            doc.addPage();
            this.drawSectionHeader(doc, 'Sin datos de ubicación del cliente');
            doc.moveDown(0.4);
            this.renderClientTable(doc, clients.filter((client) => !this.hasLocation(client)));
        }
        doc.end();
        return new Promise((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });
    }
    drawLocalityTable(doc, title, rows) {
        if (rows.length === 0) {
            return;
        }
        const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        this.drawSubheading(doc, title);
        doc.moveDown(0.2);
        const headers = ['Localidad', 'Consultas', '% del total'];
        const colWidths = [tableWidth * 0.6, tableWidth * 0.2, tableWidth * 0.2];
        this.drawTableHeader(doc, headers, colWidths, tableWidth);
        rows.forEach((row, index) => {
            const cells = [row.name, String(row.total), `${row.percentage}%`];
            this.drawTableRow(doc, cells, colWidths, tableWidth, index % 2 === 0);
        });
        doc.moveDown(0.6);
    }
    drawSimpleTable(doc, title, headers, rows, widthRatios) {
        if (rows.length === 0) {
            return;
        }
        const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        this.drawSubheading(doc, title);
        doc.moveDown(0.2);
        const colWidths = this.getTableWidthsByRatios(tableWidth, widthRatios);
        this.drawTableHeader(doc, headers, colWidths, tableWidth);
        rows.forEach((row, index) => {
            this.drawTableRow(doc, row, colWidths, tableWidth, index % 2 === 0);
        });
        doc.moveDown(0.8);
    }
    getTableWidthsByRatios(tableWidth, ratios) {
        const total = ratios.reduce((sum, value) => sum + value, 0);
        return ratios.map((value) => Math.floor((value / total) * tableWidth));
    }
    renderClientTable(doc, clients) {
        if (clients.length === 0) {
            return;
        }
        const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidths = this.getClientTableWidths(tableWidth);
        const headers = [
            'Cliente',
            'Telefono',
            'Email',
            'Producto',
            'Ubicacion',
            'Estado',
            'Seguimiento',
            'Reconsulta',
            'Creado',
        ];
        this.drawTableHeader(doc, headers, colWidths, tableWidth);
        clients.forEach((client, index) => {
            const row = this.buildClientRow(client);
            this.drawTableRow(doc, row, colWidths, tableWidth, index % 2 === 0);
            this.drawClientDetailRow(doc, client, tableWidth);
        });
    }
    drawTableHeader(doc, headers, colWidths, tableWidth) {
        this.ensurePageSpace(doc, 28);
        const startX = doc.page.margins.left;
        const startY = doc.y;
        doc.fillColor('#0F172A').rect(startX, startY, tableWidth, 20).fill();
        doc.fillColor('#FFFFFF').fontSize(8);
        let x = startX;
        headers.forEach((header, idx) => {
            doc.text(header, x + 4, startY + 5, { width: colWidths[idx] - 8 });
            x += colWidths[idx];
        });
        doc.moveDown(1.1);
    }
    drawTableRow(doc, row, colWidths, tableWidth, shaded) {
        const startX = doc.page.margins.left;
        const paddingY = 3;
        const paddingX = 3;
        const rowHeights = row.map((cell, idx) => doc.heightOfString(cell, { width: colWidths[idx] - paddingX * 2 }));
        const rowHeight = Math.max(...rowHeights, 10) + paddingY * 2;
        this.ensurePageSpace(doc, rowHeight + 6);
        const startY = doc.y;
        if (shaded) {
            doc.fillColor('#F8FAFC').rect(startX, startY, tableWidth, rowHeight).fill();
        }
        let x = startX;
        doc.fontSize(7).fillColor('#111827');
        row.forEach((cell, idx) => {
            doc.text(cell, x + paddingX, startY + paddingY, {
                width: colWidths[idx] - paddingX * 2,
            });
            x += colWidths[idx];
        });
        doc
            .moveTo(startX, startY + rowHeight)
            .lineTo(startX + tableWidth, startY + rowHeight)
            .strokeColor('#E2E8F0')
            .stroke();
        doc.moveDown(0.6);
    }
    buildClientRow(client) {
        const ubicacion = client.ubicacion ?? {};
        return [
            [client.nombre, client.apellido].filter(Boolean).join(' ') || 'Sin nombre',
            client.telefono ?? '',
            client.correo ?? '',
            client.producto ?? '',
            this.buildLocationLabel(ubicacion, client),
            client.estado ?? '',
            client.siguiendo ?? '',
            client.isReconsulta ? 'Si' : 'No',
            client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '',
        ];
    }
    getClientTableWidths(tableWidth) {
        const raw = [1.6, 1, 1.5, 1.3, 2.2, 1, 1.1, 0.9, 1];
        const total = raw.reduce((a, b) => a + b, 0);
        return raw.map((value) => Math.floor((value / total) * tableWidth));
    }
    drawClientDetailRow(doc, client, tableWidth) {
        const line = this.buildClientDetailLine(client);
        const paddingY = 3;
        const height = doc.heightOfString(line, { width: tableWidth - 10 }) + paddingY * 2;
        this.ensurePageSpace(doc, height + 4);
        const startX = doc.page.margins.left;
        const startY = doc.y;
        doc.fillColor('#FFFFFF').rect(startX, startY, tableWidth, height).fill();
        doc.fontSize(7).fillColor('#6B7280').text(line, startX + 5, startY + paddingY, {
            width: tableWidth - 10,
        });
        doc.moveDown(0.6);
    }
    buildClientDetailLine(client) {
        const parts = [];
        if (client.actividad)
            parts.push(`Actividad: ${client.actividad}`);
        if (client.medioAdquisicion)
            parts.push(`Medio: ${client.medioAdquisicion}`);
        if (client.cabezas)
            parts.push(`Cabezas: ${client.cabezas}`);
        if (client.mesesSuplemento)
            parts.push(`Meses: ${client.mesesSuplemento}`);
        if (client.observaciones)
            parts.push(`Obs: ${client.observaciones}`);
        return parts.length > 0
            ? parts.join(' | ')
            : 'Sin datos adicionales para este cliente.';
    }
    buildLocationLabel(ubicacion, client) {
        const parts = [
            ubicacion?.localidad ?? client.localidad,
            ubicacion?.provincia ?? client.provincia,
            ubicacion?.pais,
        ].filter((value) => this.isValidLocationValue(value));
        return parts.length > 0 ? parts.join(', ') : 'Sin datos';
    }
    drawSectionHeader(doc, text) {
        const startX = doc.page.margins.left;
        const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const y = doc.y;
        doc.fillColor('#0F172A').rect(startX, y, width, 26).fill();
        doc.fillColor('#FBBF24').rect(startX, y, 6, 26).fill();
        doc.fillColor('#FFFFFF').fontSize(14).text(text, startX + 14, y + 7);
        doc.moveDown(1.7);
    }
    drawSubheading(doc, text) {
        const startX = doc.page.margins.left;
        doc.fillColor('#0F172A').fontSize(11).text(text, startX, doc.y);
        doc.moveDown(0.2);
    }
    isValidLocationValue(value) {
        if (!value) {
            return false;
        }
        const stringValue = String(value).trim();
        if (!stringValue) {
            return false;
        }
        const lower = stringValue.toLowerCase();
        const invalidValues = [
            '-',
            'null',
            'undefined',
            'sin datos',
            'sin informacion',
            'sin información',
            'no disponible',
            'n/a',
            'na',
            'sin localidad',
            'sin provincia',
            'sin pais',
            'sin país',
        ];
        if (invalidValues.includes(lower)) {
            return false;
        }
        if (lower.includes('{{') || lower.includes('}}') || lower.includes('cuf_')) {
            return false;
        }
        return true;
    }
    matchesProvince(client, province) {
        const ubicacion = client.ubicacion ?? {};
        if (!ubicacion.esNormalizada || !ubicacion.provincia) {
            return false;
        }
        return (this.normalizeProvinceKey(ubicacion.provincia) === this.normalizeProvinceKey(province));
    }
    hasLocation(client) {
        const ubicacion = client.ubicacion ?? {};
        if (!ubicacion.esNormalizada) {
            return false;
        }
        const values = [ubicacion.provincia, ubicacion.localidad, ubicacion.zona];
        return values.some((value) => this.isValidLocationValue(value));
    }
    ensurePageSpace(doc, space) {
        const bottom = doc.page.height - doc.page.margins.bottom;
        if (doc.y + space >= bottom) {
            doc.addPage();
        }
    }
    async ensureNormalizedLocations(filters) {
        const retryAfter = new Date(Date.now() - this.geoFailureTtlMs);
        const query = {
            $and: [
                {
                    $or: [
                        { 'ubicacion.esNormalizada': { $ne: true } },
                        { ubicacion: { $exists: false } },
                    ],
                },
                {
                    $or: [
                        { localidad: { $exists: true, $ne: null } },
                        { provincia: { $exists: true, $ne: null } },
                        { 'ubicacion.localidad': { $exists: true, $ne: null } },
                        { 'ubicacion.provincia': { $exists: true, $ne: null } },
                        { 'ubicacion.zona': { $exists: true, $ne: null } },
                    ],
                },
                {
                    $or: [
                        { 'ubicacion.normalizacionFallidaAt': { $exists: false } },
                        { 'ubicacion.normalizacionFallidaAt': { $lte: retryAfter } },
                    ],
                },
            ],
        };
        Object.assign(query, this.buildLocationDateMatch(filters));
        for (let batchIndex = 0; batchIndex < this.normalizationMaxBatches; batchIndex += 1) {
            const candidates = await this.clientModel
                .find(query)
                .select({
                provincia: 1,
                localidad: 1,
                ubicacion: 1,
            })
                .limit(this.normalizationBatchSize)
                .lean();
            if (candidates.length === 0) {
                return;
            }
            for (let i = 0; i < candidates.length; i += this.normalizationConcurrency) {
                const batch = candidates.slice(i, i + this.normalizationConcurrency);
                await Promise.all(batch.map((client) => this.normalizeClientLocation(client)));
            }
        }
    }
    async normalizeClientLocation(client) {
        const rawParts = this.extractLocationParts(client);
        if (!rawParts) {
            return;
        }
        const query = rawParts.query;
        if (query.length < 3) {
            return;
        }
        const cachedFailAt = this.geoFailureCache.get(query);
        if (cachedFailAt && Date.now() - cachedFailAt < this.geoFailureTtlMs) {
            return;
        }
        try {
            const results = await this.geoService.search(query, 1);
            const best = results[0];
            if (!best) {
                this.geoFailureCache.set(query, Date.now());
                await this.clientModel.updateOne({ _id: client._id }, {
                    $set: {
                        'ubicacion.fuente': 'NO_MATCH',
                        'ubicacion.esNormalizada': false,
                        'ubicacion.normalizacionFallidaAt': new Date(),
                    },
                });
                return;
            }
            await this.clientModel.updateOne({ _id: client._id }, {
                $set: {
                    'ubicacion.pais': 'Argentina',
                    'ubicacion.provincia': best.provincia,
                    'ubicacion.localidad': best.localidad,
                    'ubicacion.zona': best.zona,
                    'ubicacion.lat': best.lat,
                    'ubicacion.lon': best.lon,
                    'ubicacion.displayName': best.displayName ?? best.label,
                    'ubicacion.fuente': best.fuente ?? 'NOMINATIM',
                    'ubicacion.esNormalizada': true,
                },
                $unset: {
                    'ubicacion.normalizacionFallidaAt': '',
                },
            });
        }
        catch (_error) {
            this.geoFailureCache.set(query, Date.now());
            await this.clientModel.updateOne({ _id: client._id }, {
                $set: {
                    'ubicacion.fuente': 'ERROR',
                    'ubicacion.esNormalizada': false,
                    'ubicacion.normalizacionFallidaAt': new Date(),
                },
            });
        }
    }
    extractLocationParts(client) {
        const ubicacion = client.ubicacion ?? {};
        const rawLocality = this.pickFirstValid([
            ubicacion.localidad,
            client.localidad,
        ]);
        const rawProvince = this.pickFirstValid([
            ubicacion.provincia,
            client.provincia,
        ]);
        const rawZone = this.pickFirstValid([ubicacion.zona]);
        const combined = [rawLocality, rawProvince, rawZone]
            .filter((value) => this.isValidLocationValue(value))
            .join(' ')
            .trim();
        if (!combined) {
            return null;
        }
        let locality = rawLocality ?? undefined;
        let province = rawProvince ?? undefined;
        const parsedFromLocality = rawLocality
            ? this.splitLocationTokens(rawLocality)
            : null;
        if (parsedFromLocality?.province && !province) {
            province = parsedFromLocality.province;
        }
        if (parsedFromLocality?.locality) {
            locality = parsedFromLocality.locality;
        }
        const parsedFromProvince = rawProvince
            ? this.splitLocationTokens(rawProvince)
            : null;
        if (!province && parsedFromProvince?.province) {
            province = parsedFromProvince.province;
        }
        if (!locality && parsedFromProvince?.locality) {
            locality = parsedFromProvince.locality;
        }
        province = province ? this.normalizeProvinceAlias(province) : undefined;
        const queryParts = [
            locality,
            province,
            rawZone && !province ? rawZone : undefined,
            'Argentina',
        ].filter((value) => this.isValidLocationValue(value));
        if (queryParts.length === 0) {
            return null;
        }
        return { query: queryParts.join(', ') };
    }
    splitLocationTokens(value) {
        if (!value) {
            return null;
        }
        const cleaned = value.replace(/\s+/g, ' ').trim();
        if (!cleaned) {
            return null;
        }
        if (cleaned.includes(',')) {
            const [left, right] = cleaned.split(',').map((part) => part.trim());
            const province = right ? this.normalizeProvinceAlias(right) : undefined;
            return {
                locality: left || undefined,
                province,
            };
        }
        const alias = this.normalizeProvinceAlias(cleaned);
        if (alias && alias !== cleaned) {
            const locality = cleaned
                .replace(new RegExp(alias, 'i'), '')
                .replace(/\b(bsas|buenos aires|caba|cba|mza|sf|sta fe|er)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            return {
                locality: locality || undefined,
                province: alias,
            };
        }
        return { province: alias || cleaned };
    }
    normalizeProvinceAlias(value) {
        const lower = value.toLowerCase();
        const normalized = lower
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\./g, '')
            .trim();
        const patterns = [
            [/\b(bsas|buenos aires|b a|baires)\b/i, 'Buenos Aires'],
            [/\b(caba|ciudad autonoma)\b/i, 'Ciudad Autónoma de Buenos Aires'],
            [/\b(cba|cordoba)\b/i, 'Córdoba'],
            [/\b(sf|santa fe|sta fe)\b/i, 'Santa Fe'],
            [/\b(er|entre rios)\b/i, 'Entre Ríos'],
            [/\b(la pampa|lp)\b/i, 'La Pampa'],
            [/\b(mza|mendoza)\b/i, 'Mendoza'],
            [/\b(misiones)\b/i, 'Misiones'],
            [/\b(rio negro|rionegro)\b/i, 'Río Negro'],
            [/\b(tucuman|tuc)\b/i, 'Tucumán'],
            [/\b(san luis)\b/i, 'San Luis'],
            [/\b(san juan)\b/i, 'San Juan'],
            [/\b(chaco)\b/i, 'Chaco'],
            [/\b(chubut)\b/i, 'Chubut'],
            [/\b(corrientes)\b/i, 'Corrientes'],
            [/\b(formosa)\b/i, 'Formosa'],
            [/\b(jujuy)\b/i, 'Jujuy'],
            [/\b(la rioja)\b/i, 'La Rioja'],
            [/\b(neuquen)\b/i, 'Neuquén'],
            [/\b(salta)\b/i, 'Salta'],
            [/\b(santa cruz)\b/i, 'Santa Cruz'],
            [/\b(santiago del estero)\b/i, 'Santiago del Estero'],
            [/\b(tierra del fuego)\b/i, 'Tierra del Fuego'],
            [/\b(catamarca)\b/i, 'Catamarca'],
        ];
        for (const [regex, province] of patterns) {
            if (regex.test(normalized)) {
                return province;
            }
        }
        return value.trim();
    }
    pickFirstValid(values) {
        for (const value of values) {
            if (this.isValidLocationValue(value)) {
                return String(value).trim();
            }
        }
        return undefined;
    }
    buildHeatmapProvinces(report) {
        const total = report.total;
        const provinceMap = new Map();
        report.countries.forEach((country) => {
            country.provinces.forEach((province) => {
                const normalized = this.normalizeProvinceKey(province.name);
                if (!normalized || normalized.startsWith('sin ')) {
                    return;
                }
                const current = provinceMap.get(normalized);
                if (current) {
                    current.total += province.total;
                    current.percentage = total > 0 ? Math.round((current.total / total) * 100) : 0;
                    if (province.name.length > current.name.length) {
                        current.name = province.name;
                    }
                }
                else {
                    provinceMap.set(normalized, {
                        name: province.name,
                        normalized,
                        total: province.total,
                        percentage: total > 0 ? Math.round((province.total / total) * 100) : 0,
                    });
                }
            });
        });
        return Array.from(provinceMap.values()).sort((a, b) => b.total - a.total);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('Customer')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        follow_up_events_service_1.FollowUpEventsService,
        geo_service_1.GeoService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map