import * as fluent from '@fluent/syntax';

export class Resource extends fluent.Resource {
    exists(args: { type: NodeType }): boolean {
        throw 'Unimplemented';
    }

    create(args: { messageId: fluent.Message['id']; attributeId?: fluent.Attribute['id'] }): Resource {
        throw 'Unimplemented';
    }

    get(args: { messageId: fluent.Message['id']; attributeId?: fluent.Attribute['id'] }): fluent.Pattern {
        throw 'Unimplemented';
    }

    update(args: {
        messageId: fluent.Message['id'];
        attributeId?: fluent.Attribute['id'];
        pattern: fluent.Pattern;
    }): Resource {
        throw 'Unimplemented';
    }

    delete(args: { messageId: fluent.Message['id']; attributeId?: fluent.Attribute['id'] }): Resource {
        throw 'Unimplemented';
    }
}

type NodeType = fluent.Message['type'] | fluent.Attribute['type'];

const x: Resource = new Resource();
console.log(x);
