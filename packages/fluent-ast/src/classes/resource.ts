import { Result } from '@inlang/result';
import { Identifier, Resource as FluentResource } from '@fluent/syntax';
import { Attribute } from './attribute';
import { Message } from './message';
import { isValidId } from '../utils';
import { cloneDeep } from 'lodash-es';

export class Resource extends FluentResource {
    /**
     * Returns whether or not the resource includes the given node.
     *
     * Searching for attributes requires the message id to be specified.
     */
    includes(query: {
        message: { id: string | Message['id'] };
        attribute?: { id: string | Attribute['id'] };
    }): boolean {
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

    create(query: { message: Message }): Result<Resource, Error>;
    create(query: { attribute: Attribute & { messageId: string } }): Result<Resource, Error>;
    create(query: { message?: Message; attribute?: Attribute & { messageId: string } }): Result<Resource, Error> {
        if (query.message) {
            return this.#createMessage(query.message);
        } else if (query.attribute) {
            return this.#createAttribute(query.attribute);
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

    update(query: { message: { id: string; with: Message } }): Resource {
        throw 'Unimplemented';
    }

    delete(node: Pick<Message | Attribute, 'type' | 'id'>): Resource {
        throw 'Unimplemented';
    }

    // ----- Private functions -----
    #createMessage(message: Message): Result<Resource, Error> {
        if (this.includes({ message: { id: message.id } })) {
            return Result.err(Error(`Message id ${message.id} already exists.`));
        }
        if (isValidId(message.id) === false) {
            return Result.err(Error(`Message id ${message.id} is not a valid id.`));
        }
        const cloned = cloneDeep(this);
        cloned.body.push(message);
        return Result.ok(cloned);
    }

    #createAttribute(attribute: Attribute & { messageId: string }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const message = cloned.get({ message: { id: attribute.messageId } });
        if (message === undefined) {
            return Result.err(Error(`Message id ${attribute.messageId} does not exist.`));
        } else {
            if (message?.attributes.some((attribute) => attribute.id.name === attribute.id.name)) {
                return Result.err(
                    Error(
                        `Attribute with id "${attribute.id.name}" already exists for the message with id "${attribute.messageId}".`
                    )
                );
            }
            message.attributes.push(attribute);
            return Result.ok(cloned);
        }
    }
}
