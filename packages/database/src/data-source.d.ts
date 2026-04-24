import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
export declare const entities: Function[];
export declare function buildDataSourceOptions(databaseUrl: string, extraEntities?: Function[]): DataSourceOptions;
/**
 * Standalone DataSource for TypeORM CLI (migrations).
 * Requires DATABASE_URL env var.
 */
declare const AppDataSource: DataSource;
export default AppDataSource;
//# sourceMappingURL=data-source.d.ts.map