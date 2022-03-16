import Ajv from 'ajv';
import { Result } from '../../utils/dist';
import addFormats from 'ajv-formats';
import schemaV1 from './schemas/v1.json';
import { InlangConfig } from './types/inlangConfig';

/**
 * Validate specific properties of the inlang config schema.
 *
 * Note `validate()` can be used to validate the whole config schema.
 */
export function validatePartially(properties: Partial<InlangConfig['any']>): Result<'isOk', Error> {
    // ajv can throw
    try {
        const schema = schemaV1 as unknown as Record<string, Record<string, string>>;
        const ajv = addFormats(new Ajv({}));
        for (const key of Object.keys(properties)) {
            const isValid = ajv.validate(schema.properties[key], properties[key]);
            if (isValid === false && ajv.errors) {
                return Result.err(Error(`'${key}': ${ajv.errors[0].message}`));
            }
        }
        return Result.ok('isOk');
    } catch (error) {
        return Result.err(error as Error);
    }
}
