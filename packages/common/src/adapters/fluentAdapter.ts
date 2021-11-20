import * as fluent from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';

export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, Error> {
        try {
            return Result.ok(fluent.parse(data, { withSpans: false }));
        } catch (e) {
            return Result.err(e as Error);
        }
    }

    serialize(resource: fluent.Resource): Result<string, Error> {
        try {
            return Result.ok(fluent.serialize(resource, { withJunk: false }));
        } catch (e) {
            return Result.err(e as Error);
        }
    }
}
