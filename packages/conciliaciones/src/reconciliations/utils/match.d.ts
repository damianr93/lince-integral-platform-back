export type ExtractLine = {
    id: string;
    date: Date | null;
    amountKey: number;
};
export type SystemLine = {
    id: string;
    issueDate: Date | null;
    dueDate: Date | null;
    amountKey: number;
};
export type SystemLineWithDescription = SystemLine & {
    amount: number;
    description: string | null;
};
export type MatchResult = {
    extractId: string;
    systemId: string;
    deltaDays: number;
};
export declare function matchOneToOne(systemLines: SystemLine[], extractLines: ExtractLine[], windowDays: number): {
    matches: MatchResult[];
    usedExtract: Set<string>;
    usedSystem: Set<string>;
};
export declare function matchManyToOneByComment(systemLines: SystemLineWithDescription[], extractLines: ExtractLine[], usedExtract: Set<string>, usedSystem: Set<string>): MatchResult[];
//# sourceMappingURL=match.d.ts.map