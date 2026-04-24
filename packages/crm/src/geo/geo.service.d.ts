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
export declare class GeoService {
    private readonly cache;
    private readonly ttlMs;
    private provincesCache;
    private readonly provincesTtlMs;
    search(query: string, limit: number): Promise<GeoResult[]>;
    argentinaProvincesGeoJson(): Promise<unknown>;
    private normalizeGeoJsonCoordinates;
    private swapAndScaleCoordinates;
    private mercatorToWgs84;
    private buildQueryVariants;
    private expandProvinceAliases;
}
export {};
//# sourceMappingURL=geo.service.d.ts.map