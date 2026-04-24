export type AmountMode = 'single' | 'debe-haber';
export declare function parseAmount(value: unknown): number | null;
export declare function parseDate(value: unknown): Date | null;
export declare function toAmountKey(amount: number, decimals?: number): number;
export declare function toAmountKeySafe(value: number | string): number;
export declare function extractAmount(row: Record<string, unknown>, mode: AmountMode, amountCol?: string, debeCol?: string, haberCol?: string): number | null;
export declare function normalizeText(text?: string | null): string | null;
//# sourceMappingURL=normalize.d.ts.map