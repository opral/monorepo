import { Result } from '@inlang/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema01 from './schemas/v0.1.json';
import { InlangConfig01 } from './types/v0.1';

export function validate(args: { config: Record<string, unknown> }): Result<InlangConfig01, Error> {
    // ajv can throw
    try {
        const ajv = addFormats(new Ajv({})).compile(schema01);
        const valid = ajv(args.config);
        if (valid) {
            return Result.ok(args.config as InlangConfig01);
        } else if (ajv.errors) {
            return Result.err(Error(`'${ajv.errors[0].instancePath}': ${ajv.errors[0].message}`));
        }
        return Result.err(Error('unknown error.'));
    } catch (error) {
        return Result.err(error as Error);
    }
}
