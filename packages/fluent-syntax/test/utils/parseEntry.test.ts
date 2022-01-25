import ftl from '@fluent/dedent';
import { parseEntry } from '../../src/utils/parseEntry';

it('should parse a message with variables and term references', () => {
    const message = parseEntry(
        ftl`
    welcome = Welcome to this test.
    `
    );
    if (message.isErr) {
        fail(message.error);
    } else if (message.value.type !== 'Message') {
        fail('return type was not a message');
    } else {
        expect(message.value.id.name === 'welcome');
        expect(message.value.value?.elements[0].value).toEqual('Welcome to this test.');
    }
});

it('should return Result.err when junk has been parsed', () => {
    const message = parseEntry(
        ftl`
    welcome = Welcome  {invalid{} to this test.
    `
    );
    expect(message.isErr).toBeTruthy();
});
