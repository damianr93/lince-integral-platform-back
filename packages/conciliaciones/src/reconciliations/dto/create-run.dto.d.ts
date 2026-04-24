import { ExtractMappingDto, SystemMappingDto } from './mapping.dto';
export declare class DatasetDto {
    rows: Record<string, unknown>[];
    mapping: ExtractMappingDto;
    excludeConcepts?: string[];
}
export declare class SystemDatasetDto {
    rows: Record<string, unknown>[];
    mapping: SystemMappingDto;
}
export declare class CreateRunDto {
    title?: string;
    bankName?: string;
    accountRef?: string;
    windowDays?: number;
    cutDate?: string;
    extract: DatasetDto;
    system: SystemDatasetDto;
    enabledCategoryIds?: string[];
}
//# sourceMappingURL=create-run.dto.d.ts.map