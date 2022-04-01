import * as fluent from '@fluent/syntax';

export class Resource extends fluent.Resource {
    constructor(body?: Array<fluent.Entry>) {
        super(body);
    }

    messageExists(args: { id: fluent.Message['id']['name'] }): boolean {
        for (const entry of this.body ?? []) {
            if (entry.type === 'Message' && entry.id.name === args.id) {
                return true;
            }
        }
        return false;
    }
}
