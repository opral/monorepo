import ftl from '@fluent/dedent';
import { parseEntry } from '../../src/utils/parseEntry';

it('should parse a message with variables and term references', () => {
    const message = parseEntry(
        ftl`
    welcome = Welcome to this test.
    `,
        { expectType: 'Message' }
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

it('should return an error if multiple entries are being parse', () => {
    const result = parseEntry(
        ftl`
    welcome = Welcome to this test.
    hello = Hello to this test.
    `,
        { expectType: 'Message' }
    );
    expect(result.isErr).toBeTruthy();
});

it('should return an error if the expected type does not equal the actual type', () => {
    const result = parseEntry(
        ftl`
    welcome = Welcome to this test.
    `,
        { expectType: 'Term' }
    );
    expect(result.isErr).toBeTruthy();
});
