import { Comment, GroupComment } from '@inlang/fluent-syntax';
import { lintComments } from '../src/lintComments';

it('should return Result.ok if the types are identical', () => {
    const result = lintComments({
        source: new Comment('Today is beautiful weather.'),
        target: new Comment('Heute ist schönes Wetter.'),
    });
    expect(result.isOk).toBeTruthy();
});

it('should return Result.err if the types are not identical', () => {
    const result = lintComments({
        source: new GroupComment('Today is beautiful weather.'),
        target: new Comment('Heute ist schönes Wetter.'),
    });
    expect(result.isOk).toBeFalsy();
});
