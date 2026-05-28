import { ConfigService } from '@nestjs/config';

export function resolveAdvisorConfig(
  siguiendo: string | null | undefined,
  map: Record<string, string>,
  config: ConfigService,
): string | null {
const key = siguiendo?.toUpperCase() ?? 'SIN_ASIGNAR';
const envKey = map[key];
if (!envKey) return null;
const value = config.get<string>(envKey, '');
return value && value.trim().length > 0 ? value.trim() : null;

}