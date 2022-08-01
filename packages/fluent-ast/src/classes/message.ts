import { Message as FluentMessage } from '@fluent/syntax';
import { Result } from '@inlang/result';
import { parsePattern } from '../utils';
import { Attribute } from './attribute';
import { Identifier } from './identifier';
import { Comment } from './comment';

export class Message extends FluentMessage {
    static from(args: {
        id: string;
        comment?: Comment;
        value?: string;
        attributes?: Attribute[];
    }): Result<Message, Error> {
        try {
            return Result.ok(
                new Message(
                    new Identifier(args.id),
                    args.value ? parsePattern(args.value).unwrap() : undefined,
                    args.attributes ?? [],
                    args.comment
                )
            );
        } catch (error) {
            return Result.err(error as Error);
        }
    }
}
