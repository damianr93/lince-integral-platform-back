export declare class RawLogEntity {
    id: string;
    method: string;
    path: string;
    headers: Record<string, string> | null;
    queryParams: Record<string, string> | null;
    bodyRaw: string | null;
    bodyParsed: Record<string, unknown> | null;
    deviceSn: string | null;
    ip: string | null;
    createdAt: Date;
}
//# sourceMappingURL=raw-log.entity.d.ts.map