import { InlangConfig01 } from './types/v0.1';
import schema01 from './schemas/v0.1.json';
import Ajv from 'ajv';
import { Result } from '@inlang/common';

export function validate(args: { config: Record<string, unknown> }): Result<InlangConfig01, Error> {
    const ajv = new Ajv({}).compile(schema01);
    const valid = ajv(args.config);
    if (valid) {
        return Result.ok(args.config as InlangConfig01);
    } else if (ajv.errors) {
        return Result.err(Error(ajv.errors[0].message));
    }
    return Result.err(Error('unknown error.'));
}
