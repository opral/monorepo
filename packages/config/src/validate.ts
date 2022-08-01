import { Result } from '@inlang/result';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schemaV1 from './schemas/v1.json';
import { InlangConfig } from './types/inlangConfig';

/**
 * Validate a whole inlang config.
 *
 * Note `validatePartialProperties()` can be used for partial validation.
 */
export function validate(args: {
    config: Record<string, unknown>;
}): Result<InlangConfig['any'], Error> {
    // ajv can throw
    try {
        const ajv = addFormats(new Ajv({}));
        const valid = ajv.validate(schemaV1, args.config);
        if (valid) {
            return Result.ok(args.config as InlangConfig['any']);
        } else if (ajv.errors) {
            return Result.err(Error(`'${ajv.errors[0].instancePath}': ${ajv.errors[0].message}`));
        }
        return Result.err(Error('unknown error.'));
    } catch (error) {
        return Result.err(error as Error);
    }
}
