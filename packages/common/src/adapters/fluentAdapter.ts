import * as fluent from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';

export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, unknown> {
        try {
            return {
                data: fluent.parse(data, { withSpans: false }),
                error: null,
            };
        } catch (e) {
            return {
                data: null,
                error: e,
            };
        }
    }

    serialize(resource: fluent.Resource): Result<string, unknown> {
        try {
            return {
                data: fluent.serialize(resource, { withJunk: false }),
                error: null,
            };
        } catch (e) {
            return {
                data: null,
                error: e,
            };
        }
    }
}
