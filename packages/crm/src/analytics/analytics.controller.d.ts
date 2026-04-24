import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
export declare const IS_PUBLIC_KEY = "IS_PUBLIC_KEY";
export declare const Public: () => import("node_modules/@nestjs/common").CustomDecorator<string>;
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    totales(year?: string): Promise<{
        totalContacts: number;
        totalReconsultas: number;
        firstTimeContacts: number;
        byChannel: import("./interfaces/analytics.interface").ChannelData[];
    }>;
    evolution(year?: string): Promise<import("./interfaces/analytics.interface").TimePoint[]>;
    yearlyComparison(years?: string): Promise<Record<string, string | number>[]>;
    demandOfProduct(year?: string): Promise<import("./interfaces/analytics.interface").ProductData[]>;
    purchaseStatus(year?: string): Promise<{
        status: string;
        total: number;
        percentage: number;
    }[]>;
    followUpEvents(assignedTo?: string, status?: string): Promise<{
        id: string;
        customerName?: string;
        customerLastName?: string;
        assignedTo?: string;
        customerPhone?: string;
        product?: string;
        triggerStatus: string;
        templateId: string;
        message: string;
        channels: import("../follow-up/follow-up.types").MessageChannelType[];
        contactValue?: string | null;
        scheduledFor: string;
        status: import("../follow-up/schemas/follow-up-event.schema").FollowUpEventStatus;
        readyAt?: string | null;
        createdAt: string;
        completedAt?: string | null;
        notes?: string | null;
    }[]>;
    locationSummary(query: Record<string, string>): Promise<{
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
    }>;
    locationHeatmap(query: Record<string, string>): Promise<{
        total: number;
        provinces: Array<{
            name: string;
            normalized: string;
            total: number;
            percentage: number;
        }>;
    }>;
    locationDebug(query: Record<string, string>): Promise<{
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
    locationMap(res: Response, query: Record<string, string>): Promise<Response<any, Record<string, any>>>;
    locationMapBase64(query: Record<string, string>): Promise<{
        data: null;
        contentType: null;
    } | {
        data: string;
        contentType: string;
    }>;
    locationReportPdf(res: Response, query: Record<string, string>): Promise<void>;
    private normalizeLocationFilters;
    private parseYear;
    private parseYears;
}
//# sourceMappingURL=analytics.controller.d.ts.map