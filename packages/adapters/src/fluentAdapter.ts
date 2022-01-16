import { AdapterInterface } from './index';
import { Result } from '@inlang/common';
import { parse, serialize, SingleResource } from '@inlang/fluent-syntax';

export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<SingleResource, Error> {
        const parsedData = parse(data, { withSpans: false });
        for (const entry of parsedData.body) {
            if (entry.type === 'Junk') return Result.err(Error('Parsing error'));
        }
        return Result.ok(parsedData);
    }

    serialize(resource: SingleResource): Result<string, Error> {
        const serialized = serialize(resource, { withJunk: false });
        return Result.ok(serialized);
    }
}
