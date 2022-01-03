import { parse } from '@fluent/syntax';
import { serializeEntry } from '../../src/utils/serializeEntry';
import ftl from '@fluent/dedent';

it('should serialize a message with variables and term references', () => {
    const resource = parse(
        ftl`
    welcome = Welcome, {$name}, to {-brand-name}!
    `,
        {}
    );
    const message = resource.body[0];
    const result = serializeEntry(message);
    expect(result).toEqual('welcome = Welcome, { $name }, to { -brand-name }!');
});

it('should serialize a message with pluralization', () => {
    const resource = parse(
        ftl`
    shared-photos =
        {$userName} {$photoCount ->
            [one] added a new photo
           *[other] added {$photoCount} new photos
        } to {$userGender ->
            [male] his stream
            [female] her stream
           *[other] their stream
        }.
    `,
        {}
    );
    const message = resource.body[0];
    const result = serializeEntry(message);
    expect(result).toEqual(`shared-photos =
    { $userName } { $photoCount ->
        [one] added a new photo
       *[other] added { $photoCount } new photos
    } to { $userGender ->
        [male] his stream
        [female] her stream
       *[other] their stream
    }.`);
});

it('should serialize a message with attributes', () => {
    const resource = parse(
        ftl`
    login-input =
        .placeholder = email@example.com
        .aria-label = Login input value
        .title = Type your login email
    `,
        {}
    );
    const message = resource.body[0];
    const result = serializeEntry(message);
    expect(result).toEqual(`login-input =
    .placeholder = email@example.com
    .aria-label = Login input value
    .title = Type your login email`);
});

it('should serialize a term', () => {
    const resource = parse(
        ftl`
        -brand-name = Inlang
        `,
        {}
    );
    const message = resource.body[0];
    const result = serializeEntry(message);
    expect(result).toEqual('-brand-name = Inlang');
});

it('should serialize a comment', () => {
    const resource = parse(
        ftl`
    # this is a comment
    `,
        {}
    );
    const message = resource.body[0];
    const result = serializeEntry(message);
    expect(result).toEqual('# this is a comment');
});
