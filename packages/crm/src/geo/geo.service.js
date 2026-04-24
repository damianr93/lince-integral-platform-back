"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const common_1 = require("@nestjs/common");
// TODO-3 [FÁCIL/MEDIO]: Extraer "magic numbers" a constantes con nombre.
//
// El problema: los números 1000 * 60 * 60 y 1000 * 60 * 60 * 24 aparecen
// hardcodeados. No está mal matemáticamente, pero si en 6 meses alguien lee
// el código (o vos mismo) va a tener que pensar qué significa ese número.
// Esto se llama "magic number" — un número sin nombre que obliga al lector
// a deducir su significado.
//
// La solución es extraerlos a constantes con nombres descriptivos ANTES de la
// clase, así:
//
//   const ONE_HOUR_MS  = 1_000 * 60 * 60;        // 1 hora en milisegundos
//   const ONE_DAY_MS   = ONE_HOUR_MS * 24;        // 1 día en milisegundos
//
// Luego usarlos en las propiedades de abajo:
//   private readonly ttlMs         = ONE_HOUR_MS;
//   private readonly provincesTtlMs = ONE_DAY_MS;
//
// Tip: fijate en follow-up.rules.ts cómo ya se usa este mismo patrón con
// HOUR_IN_MS y DAY_IN_MS — tomalo de referencia.
let GeoService = class GeoService {
    constructor() {
        this.cache = new Map();
        this.ttlMs = 1000 * 60 * 60;
        this.provincesCache = null;
        this.provincesTtlMs = 1000 * 60 * 60 * 24;
    }
    async search(query, limit) {
        const key = `${query.toLowerCase()}::${limit}`;
        const cached = this.cache.get(key);
        const now = Date.now();
        if (cached && cached.expiresAt > now) {
            return cached.data;
        }
        const queries = this.buildQueryVariants(query);
        try {
            for (const q of queries) {
                const url = new URL('https://nominatim.openstreetmap.org/search');
                url.searchParams.set('format', 'jsonv2');
                url.searchParams.set('addressdetails', '1');
                url.searchParams.set('limit', String(Math.min(limit, 10)));
                url.searchParams.set('countrycodes', 'ar');
                url.searchParams.set('q', q);
                const response = await fetch(url.toString(), {
                    headers: {
                        'User-Agent': 'lince-crm/1.0 (contacto@lincesa.com.ar)',
                        'Accept-Language': 'es',
                    },
                });
                if (!response.ok) {
                    continue;
                }
                const data = (await response.json());
                if (!data.length) {
                    continue;
                }
                const mapped = data.map((item) => {
                    const address = item.address ?? {};
                    const localidad = address.city ||
                        address.town ||
                        address.village ||
                        address.municipality ||
                        address.suburb;
                    const zona = address.county || address.region;
                    const provincia = address.state || address.region || zona;
                    return {
                        id: String(item.place_id),
                        label: item.display_name,
                        pais: address.country,
                        provincia: provincia,
                        localidad,
                        zona,
                        lat: Number(item.lat),
                        lon: Number(item.lon),
                        displayName: item.display_name,
                        fuente: 'NOMINATIM',
                    };
                });
                this.cache.set(key, { expiresAt: now + this.ttlMs, data: mapped });
                return mapped;
            }
            this.cache.set(key, { expiresAt: now + this.ttlMs, data: [] });
            return [];
        }
        catch (_error) {
            this.cache.set(key, { expiresAt: now + this.ttlMs, data: [] });
            return [];
        }
    }
    async argentinaProvincesGeoJson() {
        const now = Date.now();
        if (this.provincesCache && this.provincesCache.expiresAt > now) {
            return this.provincesCache.data;
        }
        const url = 'https://wms.ign.gob.ar/geoserver/ign/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ign:provincia&outputFormat=application/json&srsName=EPSG:4326&maxFeatures=30';
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'lince-crm/1.0 (contacto@lincesa.com.ar)',
                    'Accept-Language': 'es',
                },
            });
            if (!response.ok) {
                throw new Error(`IGN error: ${response.status}`);
            }
            const data = await response.json();
            const normalized = this.normalizeGeoJsonCoordinates(data);
            this.provincesCache = { expiresAt: now + this.provincesTtlMs, data: normalized };
            return normalized;
        }
        catch (_error) {
            throw new common_1.InternalServerErrorException('No se pudo obtener el mapa provincial');
        }
    }
    normalizeGeoJsonCoordinates(data) {
        if (!data || !Array.isArray(data.features)) {
            return data;
        }
        const features = data.features.map((feature) => {
            if (!feature?.geometry?.coordinates) {
                return feature;
            }
            const coords = feature.geometry.coordinates;
            const normalizedCoords = this.swapAndScaleCoordinates(coords);
            return {
                ...feature,
                geometry: {
                    ...feature.geometry,
                    coordinates: normalizedCoords,
                },
            };
        });
        return { ...data, features };
    }
    swapAndScaleCoordinates(input) {
        if (!Array.isArray(input)) {
            return input;
        }
        if (typeof input[0] === 'number' && typeof input[1] === 'number') {
            let x = input[0];
            let y = input[1];
            if (Math.abs(x) > 1000 || Math.abs(y) > 1000) {
                const converted = this.mercatorToWgs84(x, y);
                x = converted[0];
                y = converted[1];
            }
            if (Math.abs(x) <= 90 && Math.abs(y) > 90) {
                return [y, x];
            }
            return [x, y];
        }
        return input.map((item) => this.swapAndScaleCoordinates(item));
    }
    mercatorToWgs84(x, y) {
        const radius = 6378137;
        const lon = (x / radius) * (180 / Math.PI);
        const lat = (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) * (180 / Math.PI);
        return [lon, lat];
    }
    buildQueryVariants(query) {
        const trimmed = query.trim();
        if (!trimmed) {
            return [];
        }
        const expanded = this.expandProvinceAliases(trimmed);
        const variants = new Set([trimmed, expanded]);
        const addArgentina = (value) => {
            if (!/argentina/i.test(value)) {
                variants.add(`${value}, Argentina`);
            }
        };
        addArgentina(trimmed);
        addArgentina(expanded);
        if (trimmed.includes(',')) {
            const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const swapped = `${parts.slice(1).join(', ')}, ${parts[0]}`;
                variants.add(swapped);
                addArgentina(swapped);
            }
        }
        if (expanded.includes(',')) {
            const parts = expanded.split(',').map((part) => part.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const swapped = `${parts.slice(1).join(', ')}, ${parts[0]}`;
                variants.add(swapped);
                addArgentina(swapped);
            }
        }
        return Array.from(variants).filter((value) => value.length > 0).slice(0, 6);
    }
    expandProvinceAliases(value) {
        const replacements = [
            [/\b(bsas|buenos aires|b a|baires)\b/gi, 'Buenos Aires'],
            [/\b(caba|ciudad autonoma)\b/gi, 'Ciudad Autónoma de Buenos Aires'],
            [/\b(cba|cordoba)\b/gi, 'Córdoba'],
            [/\b(sf|santa fe|sta fe)\b/gi, 'Santa Fe'],
            [/\b(er|entre rios)\b/gi, 'Entre Ríos'],
            [/\b(la pampa|lp)\b/gi, 'La Pampa'],
            [/\b(mza|mendoza)\b/gi, 'Mendoza'],
            [/\b(rio negro|rionegro)\b/gi, 'Río Negro'],
            [/\b(tucuman|tuc)\b/gi, 'Tucumán'],
            [/\b(neuquen)\b/gi, 'Neuquén'],
        ];
        let result = value;
        replacements.forEach(([regex, replacement]) => {
            result = result.replace(regex, replacement);
        });
        return result.trim();
    }
};
exports.GeoService = GeoService;
exports.GeoService = GeoService = __decorate([
    (0, common_1.Injectable)()
], GeoService);
//# sourceMappingURL=geo.service.js.map