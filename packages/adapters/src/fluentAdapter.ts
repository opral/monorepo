import { AdapterInterface } from './index';
import { Result } from '@inlang/common';
import { parse, serializeExpression, SingleResource } from '@inlang/fluent-syntax';

export class FluentAdapter implements AdapterInterface {
    parse(data: string): Result<SingleResource, Error> {
        const parsedData = parse(data, { withSpans: false });
        for (const entry of parsedData.body) {
            if (entry.type === 'Junk') return Result.err(Error('Parsing error'));
        }
        return Result.ok(parsedData);
    }

    serialize(resource: SingleResource): Result<string, Error> {
        let out = '';
        for (const entry of resource.body) {
            if (entry.type === 'Message' && entry.value !== null) {
                out += entry.id.name + ' = ';
                for (const element of entry.value?.elements ?? []) {
                    if (element.type === 'Placeable') {
                        out += '{' + serializeExpression(element.expression) + '}';
                    } else {
                        out += element.value;
                    }
                }
                out += '\n';
            }
        }
        return Result.ok(out);
    }
}
