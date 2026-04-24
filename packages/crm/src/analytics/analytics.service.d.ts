import { Model } from 'mongoose';
import { Customer } from '../customers/schemas/customer.schema';
import { ChannelData, ProductData, TimePoint } from './interfaces/analytics.interface';
import { FollowUpEventsService } from '../follow-up/follow-up-events.service';
import { GeoService } from '../geo/geo.service';
import { FollowUpEventStatus } from '../follow-up/schemas/follow-up-event.schema';
import { MessageChannelType } from '../follow-up/follow-up.types';
type FollowUpEventView = {
    id: string;
    customerName?: string;
    customerLastName?: string;
    assignedTo?: string;
    customerPhone?: string;
    product?: string;
    triggerStatus: string;
    templateId: string;
    message: string;
    channels: MessageChannelType[];
    contactValue?: string | null;
    scheduledFor: string;
    status: FollowUpEventStatus;
    readyAt?: string | null;
    createdAt: string;
    completedAt?: string | null;
    notes?: string | null;
};
type LocationFilters = {
    year?: number;
    startDate?: string;
    endDate?: string;
    provincias?: string[];
    paises?: string[];
    zonas?: string[];
};
type LocationSummary = {
    total: number;
    noLocation: {
        total: number;
        percentage: number;
    };
    topProvinces: Array<{
        name: string;
        total: number;
        percentage: number;
    }>;
    topLocalities: Array<{
        name: string;
        province: string;
        total: number;
        percentage: number;
    }>;
    mapPoints: Array<{
        name: string;
        lat: number;
        lon: number;
        total: number;
    }>;
};
type LocationHeatmap = {
    total: number;
    provinces: Array<{
        name: string;
        normalized: string;
        total: number;
        percentage: number;
    }>;
};
export declare class AnalyticsService {
    private readonly clientModel;
    private readonly followUpEventsService;
    private readonly geoService;
    private readonly normalizationBatchSize;
    private readonly normalizationConcurrency;
    private readonly normalizationMaxBatches;
    private readonly geoFailureCache;
    private readonly geoFailureTtlMs;
    constructor(clientModel: Model<Customer>, followUpEventsService: FollowUpEventsService, geoService: GeoService);
    private getYearDateRange;
    private buildCreatedAtMatchForYear;
    private buildLocationDateMatch;
    /**
     * Devuelve:
     *  - totalContacts: numero total de documentos en la coleccion clients
     *  - totalReconsultas: cantidad de registros marcados como reconsulta
     *  - firstTimeContacts: contactos unicos sin reconsulta
     *  - byChannel: arreglo de { channel, total }, agrupado por medioAdquisicion
     */
    totales(year?: number): Promise<{
        totalContacts: number;
        totalReconsultas: number;
        firstTimeContacts: number;
        byChannel: ChannelData[];
    }>;
    /**
     * Retorna un arreglo de { date: "YYYY-MM", total },
     * contando cuántos clientes se crearon en cada mes del año.
     */
    evolution(year?: number): Promise<TimePoint[]>;
    yearlyComparison(years: number[]): Promise<Array<Record<string, string | number>>>;
    /**
     * Retorna un arreglo de los productos más consultados/comprados:
     *  { product, total } ordenado de mayor a menor en base a la cuenta de clientes asociados a cada producto.
     */
    demandOfProduct(year?: number): Promise<ProductData[]>;
    purchaseStatus(year?: number): Promise<{
        status: string;
        total: number;
        percentage: number;
    }[]>;
    followUpEvents(assignedTo?: string, statusesParam?: string): Promise<FollowUpEventView[]>;
    locationSummary(filters: LocationFilters): Promise<LocationSummary>;
    locationHeatmap(filters: LocationFilters): Promise<LocationHeatmap>;
    locationReportPdf(filters: LocationFilters): Promise<Buffer>;
    locationDebug(filters: LocationFilters): Promise<{
        reportTotal: number;
        noLocation: {
            total: number;
            percentage: number;
            reconsultas: number;
        };
        topProvinces: {
            name: string;
            total: number;
        }[];
        mapPoints: {
            name: string;
            lat: number;
            lon: number;
            total: number;
        }[];
    }>;
    locationMapImage(filters: LocationFilters): Promise<{
        buffer: Buffer;
        contentType: string;
    } | null>;
    private buildSvgMap;
    private buildLocationReport;
    private buildLocationAggregations;
    private getMapPoints;
    private buildProvinceFallbackMapPoints;
    private normalizeProvinceKey;
    private persistProvinceFallbackPoints;
    private buildDiacriticRegex;
    private findClientsForReport;
    private generateLocationPdf;
    private drawLocalityTable;
    private drawSimpleTable;
    private getTableWidthsByRatios;
    private renderClientTable;
    private drawTableHeader;
    private drawTableRow;
    private buildClientRow;
    private getClientTableWidths;
    private drawClientDetailRow;
    private buildClientDetailLine;
    private buildLocationLabel;
    private drawSectionHeader;
    private drawSubheading;
    private isValidLocationValue;
    private matchesProvince;
    private hasLocation;
    private ensurePageSpace;
    private ensureNormalizedLocations;
    private normalizeClientLocation;
    private extractLocationParts;
    private splitLocationTokens;
    private normalizeProvinceAlias;
    private pickFirstValid;
    private buildHeatmapProvinces;
}
export {};
//# sourceMappingURL=analytics.service.d.ts.map