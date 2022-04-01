import * as fluent from '@fluent/syntax';

export class Resource extends fluent.Resource {
    constructor(body?: Array<fluent.Entry>) {
        super(body);
    }

    /**
     * Whether or not a message exists.
     */
    messageExists(args: { id: fluent.Message['id']['name'] }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Whether or not an attribute exists.
     */
    attributeExists(args: { messageId: fluent.Message['id']['name']; id: fluent.Attribute['id']['name'] }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.messageId) {
                for (const attribute of entry.attributes) {
                    if (attribute.id.name === args.id) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
