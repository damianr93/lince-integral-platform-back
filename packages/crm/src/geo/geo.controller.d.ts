import { GeoService } from './geo.service';
export declare class GeoController {
    private readonly geoService;
    constructor(geoService: GeoService);
    search(query?: string, limit?: string): Promise<{
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
    }[]>;
    argentinaProvinces(): Promise<unknown>;
}
//# sourceMappingURL=geo.controller.d.ts.map