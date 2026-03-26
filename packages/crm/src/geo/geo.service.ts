import { Injectable, InternalServerErrorException } from '@nestjs/common';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    state?: string;
    region?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
  };
};

type GeoResult = {
  id: string;
  label: string;
  pais?: string;
  provincia?: string;
  localidad?: string;
  zona?: string;
  lat?: number;
  lon?: number;
  displayName?: string;
  fuente: string;
};

type CacheEntry = {
  expiresAt: number;
  data: GeoResult[];
};

type ProvincesCacheEntry = {
  expiresAt: number;
  data: unknown;
};

@Injectable()
export class GeoService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 1000 * 60 * 60;
  private provincesCache: ProvincesCacheEntry | null = null;
  private readonly provincesTtlMs = 1000 * 60 * 60 * 24;

  async search(query: string, limit: number): Promise<GeoResult[]> {
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

        const data = (await response.json()) as NominatimResult[];
        if (!data.length) {
          continue;
        }

        const mapped = data.map((item) => {
          const address = item.address ?? {};
          const localidad =
            address.city ||
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
    } catch (_error) {
      this.cache.set(key, { expiresAt: now + this.ttlMs, data: [] });
      return [];
    }
  }

  async argentinaProvincesGeoJson(): Promise<unknown> {
    const now = Date.now();
    if (this.provincesCache && this.provincesCache.expiresAt > now) {
      return this.provincesCache.data;
    }

    const url =
      'https://wms.ign.gob.ar/geoserver/ign/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ign:provincia&outputFormat=application/json&srsName=EPSG:4326&maxFeatures=30';
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
    } catch (_error) {
      throw new InternalServerErrorException('No se pudo obtener el mapa provincial');
    }
  }

  private normalizeGeoJsonCoordinates(data: any): any {
    if (!data || !Array.isArray(data.features)) {
      return data;
    }
    const features = data.features.map((feature: any) => {
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

  private swapAndScaleCoordinates(input: any): any {
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
    return input.map((item: any) => this.swapAndScaleCoordinates(item));
  }

  private mercatorToWgs84(x: number, y: number): [number, number] {
    const radius = 6378137;
    const lon = (x / radius) * (180 / Math.PI);
    const lat =
      (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) * (180 / Math.PI);
    return [lon, lat];
  }

  private buildQueryVariants(query: string): string[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    const expanded = this.expandProvinceAliases(trimmed);
    const variants = new Set<string>([trimmed, expanded]);

    const addArgentina = (value: string) => {
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

  private expandProvinceAliases(value: string): string {
    const replacements: Array<[RegExp, string]> = [
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
}
