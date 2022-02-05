import { InlangConfig10 } from './types/v1.0';
import schema1_0 from '../schemas/v1.0.json';
import Ajv from 'ajv';
import { Result } from '@inlang/common';

export function validate(args: { config: Record<string, unknown> }): Result<InlangConfig10, Error> {
    const ajv = new Ajv({}).compile(schema1_0);
    const valid = ajv(args.config);
    if (valid) {
        return Result.ok(args.config as InlangConfig10);
    } else if (ajv.errors) {
        return Result.err(Error('Validating config error: ' + ajv.errors[0].message));
    }
    return Result.err(Error('Validating config: unknown error.'));
}
