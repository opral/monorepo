import { AdapterInterface } from './index';
import { Result } from '@inlang/common';
import { parse, serialize, SingleResource } from '@inlang/fluent-syntax';

export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<SingleResource, Error> {
        const parsedData = parse(data, { withSpans: false });
        return Result.ok(parsedData);
    }

    serialize(resource: SingleResource): Result<string, Error> {
        const serialized = serialize(resource, { withJunk: false });
        return Result.ok(serialized);
    }
}
