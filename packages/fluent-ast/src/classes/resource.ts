import { Resource as FluentResource } from '@fluent/syntax';
import { Attribute } from './attribute';
import { Message } from './message';

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

    create(node: Pick<Message | Attribute, 'type' | 'id'>): Resource {
        throw 'Unimplemented';
    }

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
}
