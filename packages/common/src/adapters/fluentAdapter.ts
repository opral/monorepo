import * as fluent from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';

export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, Error> {
        const parsedData = fluent.parse(data, { withSpans: false });
        for (const entry of parsedData.body) {
            if (entry.type === 'Junk') return Result.err(Error('Parsing error'));
        }
        return Result.ok(parsedData);
    }

    serialize(resource: fluent.Resource): Result<string, Error> {
        try {
            return Result.ok(fluent.serialize(resource, { withJunk: false }));
        } catch (e) {
            return Result.err(e as Error);
        }
    }
}
