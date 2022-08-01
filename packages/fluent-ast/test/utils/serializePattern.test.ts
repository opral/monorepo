import ftl from '@fluent/dedent';
import { parseEntry } from '../../src';
import { serializePattern } from '../../src/utils/serializePattern';

it('should return a message without id', () => {
    const message = parseEntry(
        ftl`
    welcome = Welcome, {$name}, to {-brand-name}!
    `
    );
    if (message.isErr || message.value.type !== 'Message' || message.value.value === null) {
        fail();
    }
    const result = serializePattern(message.value.value);
    expect(result).toEqual('Welcome, { $name }, to { -brand-name }!');
});
