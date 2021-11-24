import * as fluent from '@fluent/syntax';
import { serializeExpression } from '@fluent/syntax';
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
        let out = '';
        for (const entry of resource.body) {
            if (entry.type === 'Message') {
                if (entry.value !== null) {
                    out += entry.id.name + ' = ';
                    for (const element of entry.value?.elements) {
                        if (element.type === 'Placeable') {
                            out += '{' + serializeExpression(element.expression) + '}';
                        } else {
                            out += element.value;
                        }
                    }
                    out += '\n';
                }
            }
        }
        return Result.ok(out);
    }
}
