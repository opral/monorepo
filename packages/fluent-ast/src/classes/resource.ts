import { Result } from '@inlang/result';
import { Resource as FluentResource } from '@fluent/syntax';
import { Attribute } from './attribute';
import { Message } from './message';
import { isValidId } from '../utils';
import { cloneDeep, merge, remove } from 'lodash-es';

export class Resource extends FluentResource {
    // ----- Attribute -----

    /**
     * Returns whether or not the resource includes the given node.
     */
    includesAttribute(args: { messageId: string; id: string }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.messageId) {
                for (const attribute of entry.attributes) {
                    if (attribute.id.name === args.id) {
                        return true;
                    }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Creates the attribute in an existing message, or creates a new message with the attribute.
     */
    createAttribute(args: Attribute & { messageId: string }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const message = cloned.getMessage({ id: args.messageId });
        if (message === undefined) {
            return cloned.createMessage(Message.from({ id: args.messageId, attributes: [args] }).unwrap());
        } else if (cloned.includesAttribute({ id: args.id.name, messageId: args.messageId })) {
            return Result.err(
                Error(`Attribute with id '${args.id.name}' already exists for the message with id '${args.messageId}'.`)
            );
        }
        message.attributes.push(args);
        return Result.ok(cloned);
    }

    /**
     * Get's (retrieves) a node from the resource.
     *
     * Returns undefined if the node does not exist.
     */
    getAttribute(args: { id: string; messageId: string }): Attribute | undefined {
        for (const entry of this.body ?? []) {
            // one message id is defined.
            if (entry.type === 'Message' && entry.id.name === args.messageId) {
                for (const attribute of entry.attributes) {
                    if (attribute.id.name === args.id) {
                        return attribute;
                    }
                }
            }
        }
    }

    updateAttribute(args: { id: string; messageId: string; with: Partial<Attribute> }): Result<Resource, Error> {
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

    /**
     * Upserts the attribute.
     *
     * If the parent message does not exist, the parent message will be created.
     */
    upsertAttribute(args: Attribute & { messageId: string }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const attribute = cloned.getAttribute({ id: args.id.name, messageId: args.messageId });
        if (attribute) {
            return this.updateAttribute({ id: args.id.name, messageId: args.messageId, with: args });
        } else {
            return this.createAttribute(args);
        }
    }

    deleteAttribute(args: { messageId: string; id: string }): Result<Resource, Error> {
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

    // ----- Message -----

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
     */
    includesMessage(args: { id: string }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.id) {
                return true;
            }
        }
        return false;
    }

    createMessage(message: Message): Result<Resource, Error> {
        if (this.includesMessage({ id: message.id.name })) {
            return Result.err(Error(`Message with id '${message.id}' already exists.`));
        }
        if (isValidId(message.id) === false) {
            return Result.err(Error(`Message id '${message.id}' is not a valid id.`));
        }
        const cloned = cloneDeep(this);
        cloned.body.push(message);
        return Result.ok(cloned);
    }

    /**
     * Get's (retrieves) a node from the resource.
     *
     * Returns undefined if the node does not exist.
     */
    getMessage(args: { id: string }): Message | undefined {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.id) {
                return entry;
            }
        }
    }

    updateMessage(args: { id: string; with: Partial<Message> }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const indexOfMessage = cloned.body.findIndex((entry) => entry.type === 'Message' && entry.id.name === args.id);
        if (indexOfMessage === -1) {
            return Result.err(Error(`Message with id '${args.id}' does not exist.`));
        }
        merge(cloned.body[indexOfMessage], args.with);
        return Result.ok(cloned);
    }

    deleteMessage(args: { id: string }): Result<Resource, Error> {
        const cloned = cloneDeep(this);
        const removed = remove(cloned.body ?? [], (entry) => entry.type === 'Message' && entry.id.name === args.id);
        if (removed.length === 0) {
            return Result.err(Error(`Message with id '${args.id}' does not exist.`));
        }
        return Result.ok(cloned);
    }
}
