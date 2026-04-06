import { ValueTransformer } from 'typeorm';

export const bigintTransformer: ValueTransformer = {
  to: (value: number | null | undefined): string | null =>
    value != null ? String(value) : null,
  from: (value: string | null): number | null =>
    value != null ? Number(value) : null,
};
