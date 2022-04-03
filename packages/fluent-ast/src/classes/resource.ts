import { Result } from '@inlang/result';
import { Identifier, Resource as FluentResource } from '@fluent/syntax';
import { Attribute } from './attribute';
import { Message } from './message';
import { Comment } from './comment';
import { isValidId, parsePattern } from '../utils';
import { cloneDeep } from 'lodash-es';

export class Resource extends FluentResource {
    /**
     * Returns whether or not the resource includes the given node.
     *
     * Searching for attributes requires the message id to be specified.
     */
    includes(query: { message: { id: string }; attribute?: { id: string } }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === query.message.id) {
                if (query.attribute === undefined) {
                    return true;
                }
                for (const attribute of entry.attributes) {
                    if (attribute.id.name === query.attribute.id) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    create(query: { message: MessageQuery }): Result<Resource, Error>;
    create(query: { attribute: AttributeQuery }): Result<Resource, Error>;
    create(query: { message?: MessageQuery; attribute?: AttributeQuery }): Result<Resource, Error> {
        if (query.message) {
            return this.#createMessage(query.message);
        }
        return Result.err(Error('Unimplmented'));
    }

    /**
     * Get's (retrieves) a node from the resource.
     *
     * Returns undefined if the node does not exist.
     */
    get(query: { message: { id: string }; attribute?: { id: string } }): Message | undefined;
    get(query: { message: { id: string }; attribute: { id: string } }): Attribute | undefined;
    get(query: { message: { id: string }; attribute?: { id: string } }): Message | Attribute | undefined {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === query.message.id) {
                if (query.attribute === undefined) {
                    return entry;
                }
                for (const attribute of entry.attributes) {
                    if (attribute.id.name === query.attribute.id) {
                        return attribute;
                    }
                }
            }
        }
    }

    update(node: Pick<Message | Attribute, 'type' | 'id'>): Resource {
        throw 'Unimplemented';
    }

    delete(node: Pick<Message | Attribute, 'type' | 'id'>): Resource {
        throw 'Unimplemented';
    }

    // ----- Private functions -----
    #createMessage(args: MessageQuery): Result<Resource, Error> {
        if (args.value === null && (args.attributes === null || args.attributes?.length === 0)) {
            return Result.err(Error('The message has no value (pattern). Thus, at least one attribute is required.'));
        }
        if (this.includes({ message: { id: args.id } })) {
            return Result.err(Error(`Message id ${args.id} already exists.`));
        }
        if (isValidId(args.id) === false) {
            return Result.err(Error(`Message id ${args.id} is not a valid id.`));
        }
        const cloned = cloneDeep(this);
        try {
            const value = parsePattern(args.value).unwrap();
            cloned.body.push(
                new Message(
                    new Identifier(args.id),
                    value,
                    args.attributes?.map(
                        ({ id, value }) => new Attribute(new Identifier(id), parsePattern(value).unwrap())
                    )
                )
            );
            return Result.ok(cloned);
        } catch (error) {
            return Result.err(error as Error);
        }
    }
}

// ----- Query types -----
//
// Enable more convenient syntax for querying the resource; opposed to
// using the AST types. For example, the id can be defined as a string
// `hello` instead of `new Identifier('hello').

type MessageQuery = {
    id: string;
    comment?: Comment;
    value: string;
    attributes?: { id: string; value: string }[];
};

type AttributeQuery = {
    id: string;
    value: string;
};
