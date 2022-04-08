import { Result } from '@inlang/result';
import { Resource as FluentResource } from '@fluent/syntax';
import { Attribute } from './attribute';
import { Message } from './message';
import { isValidId } from '../utils';
import { cloneDeep, merge, remove } from 'lodash-es';

export class Resource extends FluentResource {
    /**
     * Included message ids of the resource.
     *
     * @example
     *      resource.includedIds()
     *      >> ["message-one", "message-two"]
     */
    includedMessageIds(): string[] {
        const ids: string[] = [];
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message') {
                ids.push(entry.id.name);
            }
        }
        return ids;
    }

    /**
     * Returns whether or not the resource includes the given node.
     *
     * Searching for attributes requires the message id to be specified.
     */
    includes(query: { message: { id: string } }): boolean;
    includes(query: { attribute: { messageId: string; id: string } }): boolean;
    includes(query: { message?: { id: string }; attribute?: { messageId: string; id: string } }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === (query.message?.id ?? query.attribute?.messageId)) {
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

    /**
     * Creates the specified node in the resource.
     *
     * If you want to create an attribute, create a message instead.
     */
    create(query: { message: Message }): Result<Resource, Error>;
    create(query: { message?: Message }): Result<Resource, Error> {
        if (query.message) {
            return this.createMessage(query.message);
        }
        return Result.err(Error('Unimplmented'));
    }

    /**
     * Get's (retrieves) a node from the resource.
     *
     * Returns undefined if the node does not exist.
     */
    get(query: { message: { id: string }; attribute?: { id: string; messageId: string } }): Message | undefined;
    get(query: { message?: { id: string }; attribute: { id: string; messageId: string } }): Attribute | undefined;
    get(query: {
        message?: { id: string };
        attribute?: { id: string; messageId: string };
    }): Message | Attribute | undefined {
        for (const entry of this.body ?? []) {
            // one message id is defined.
            if (entry.type === 'Message' && entry.id.name === (query.message?.id ?? query.attribute?.messageId)) {
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

    /**
     * Updates the given node.
     *
     * `with` is merged with the existing node.
     */
    update(query: { message: { id: string; with: Partial<Message> } }): Result<Resource, Error>;
    update(query: { attribute: { id: string; messageId: string; with: Partial<Attribute> } }): Result<Resource, Error>;
    update(query: {
        message?: { id: string; with: Partial<Message> };
        attribute?: { id: string; messageId: string; with: Partial<Attribute> };
    }): Result<Resource, Error> {
        if (query.message) {
            return this.updateMessage(query.message);
        } else if (query.attribute) {
            return this.updateAttribute(query.attribute);
        }
        return Result.err(Error('Unimplemented'));
    }

    delete(query: { attribute: { messageId: string; id: string } }): Result<Resource, Error>;
    delete(query: { message: { id: string } }): Result<Resource, Error>;
    delete(query: {
        message?: { id: string };
        attribute?: { messageId: string; id: string };
    }): Result<Resource, Error> {
        if (query.message) {
            return this.deleteMessage(query.message);
        } else if (query.attribute) {
            return this.deleteAttribute(query.attribute);
        }
        return Result.err(Error('Unimplemented'));
    }

    // ----- Private functions -----

    private updateAttribute(args: {
        id: string;
        messageId: string;
        with: Partial<Attribute>;
    }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const indexOfMessage = cloned.body.findIndex(
            (entry) => entry.type === 'Message' && entry.id.name === args.messageId
        );
        if (indexOfMessage === -1) {
            return Result.err(Error(`Message with id '${args.messageId}' does not exist.`));
        }
        const indexOfAttribute = (cloned.body[indexOfMessage] as Message).attributes.findIndex(
            (attribute) => attribute.id.name === args.id
        );
        if (indexOfAttribute === -1) {
            return Result.err(
                Error(`Attribute with id '${args.id}' does not exist for the message with id '${args.messageId}'.`)
            );
        }
        merge((cloned.body[indexOfMessage] as Message).attributes[indexOfAttribute], args.with);
        return Result.ok(cloned);
    }

    private deleteAttribute(args: { messageId: string; id: string }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        for (const message of cloned.body.filter((entry) => entry.type === 'Message')) {
            if ((message as Message).id.name === args.messageId) {
                const removed = remove((message as Message).attributes, (attribute) => attribute.id.name === args.id);
                if (removed.length === 0) {
                    return Result.err(
                        Error(`Attribute with id ${args.id} does not exist for message with id '${args.messageId}'.`)
                    );
                }
                return Result.ok(cloned);
            }
        }
        return Result.err(Error(`The attributes parent message with id '${args.id}' does not exist.`));
    }

    private createMessage(message: Message): Result<Resource, Error> {
        if (this.includes({ message: { id: message.id.name } })) {
            return Result.err(Error(`Message with id '${message.id}' already exists.`));
        }
        if (isValidId(message.id) === false) {
            return Result.err(Error(`Message id '${message.id}' is not a valid id.`));
        }
        const cloned = cloneDeep(this);
        cloned.body.push(message);
        return Result.ok(cloned);
    }

    private updateMessage(args: { id: string; with: Partial<Message> }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const indexOfMessage = cloned.body.findIndex((entry) => entry.type === 'Message' && entry.id.name === args.id);
        if (indexOfMessage === -1) {
            return Result.err(Error(`Message with id '${args.id}' does not exist.`));
        }
        merge(cloned.body[indexOfMessage], args.with);
        return Result.ok(cloned);
    }

    private deleteMessage(args: { id: string }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const removed = remove(cloned.body ?? [], (entry) => entry.type === 'Message' && entry.id.name === args.id);
        if (removed.length === 0) {
            return Result.err(Error(`Message with id '${args.id}' does not exist.`));
        }
        return Result.ok(cloned);
    }
}
