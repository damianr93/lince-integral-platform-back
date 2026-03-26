import { ValueTransformer } from 'typeorm';

export const bigintTransformer: ValueTransformer = {
  to: (value: bigint | null | undefined): string | null =>
    value != null ? value.toString() : null,
  from: (value: string | null): bigint | null =>
    value != null ? BigInt(value) : null,
};
