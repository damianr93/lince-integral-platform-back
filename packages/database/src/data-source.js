"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = void 0;
exports.buildDataSourceOptions = buildDataSourceOptions;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
exports.entities = [user_entity_1.UserEntity];
function buildDataSourceOptions(databaseUrl, extraEntities = []) {
    return {
        type: 'postgres',
        url: databaseUrl,
        entities: [...exports.entities, ...extraEntities],
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        synchronize: process.env['NODE_ENV'] !== 'production' ||
            process.env['DB_SYNCHRONIZE'] === 'true',
        logging: ['error', 'warn'],
    };
}
/**
 * Standalone DataSource for TypeORM CLI (migrations).
 * Requires DATABASE_URL env var.
 */
const AppDataSource = new typeorm_1.DataSource(buildDataSourceOptions(process.env['DATABASE_URL'] ?? ''));
exports.default = AppDataSource;
//# sourceMappingURL=data-source.js.map