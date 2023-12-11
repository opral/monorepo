# Building an Inlang App: A Comprehensive Guide

Inlang is a versatile globalization ecosystem that empowers developers to seamlessly integrate language translation capabilities into their applications. This comprehensive guide will walk you through the process of building a general Inlang app with the `@inlang/sdk`. 

We'll cover initializing a project, creating and updating messages, and working with lint rules.

## 1. Initialize the project

The first step is to initialize your project using the Inlang SDK. The `loadProject()` function in initializes an Inlang `object` with various functions.

```typescript
import { loadProject } from '@inlang/sdk';

const inlang = loadProject({
    projectPath: "user/project.inlang"
    nodeishFs // NodeishFs is a wrapper around the Node.js fs module
});
```

This sets the foundation for your Inlang powered application.

## 2. Create and update Messages

With the project initialized, creating and updating messages is straightforward. Use the `inlang.query.messages.create` function to create a message and `inlang.query.messages.update` to update it. 

There are also a few other query/mutation functions you can use.

### Creating Messages

```typescript
const messageData = /* your message data */;
inlang.query.messages.create({ data: messageData });
```

### Updating Messages

```typescript
const updatedMessageData = /* your updated message data */;
inlang.query.messages.update({ args: updatedMessageData });
```

These functions internally handle the loading and saving of messages according to your defined plugin (e.g., JSON, i18next, Inlang message format).

## 3. Working with Lint Rules

Lint rules are crucial for maintaining code quality and consistency. In your Inlang app, you can leverage lint rules to ensure that your localization messages adhere to specific standards. For example, let's explore working with the [`snakeCaseId`](https://inlang.com/m/messageLintRule.inlang.snakeCaseId) lint rule.

This lint rule checks whether your message id's are in a snale case format or not.

To access lint reports based on the configured lint rule on a specific `message`, you can subscribe on `inlang.query.messageLintReports.get.subscribe()` – we introduced a subscription pattern here because of the nature of lint rules which can frequently update, like with every update of the `message`.

To get the lint reports:

```typescript
inlang.query.messageLintReports.get.subscribe(
    {
        where: {
            messageId: message.messageId,
        },
    },
    (reports) => {
        /* do something with reports */
    }
);
```

In this example, we subscribe to lint reports for a specific message using `message.messageId` and can now execute a specific action with the `reports` in the callback.


## Publishing your app

If you are ready and want to release what you have built, please [publish your app](https://inlang.com/documentation/publish-to-marketplace) on our [Marketplace](https://inlang.com) – where you can also sell apps in the future.

## Conclusion

Now it's your turn! We can't wait what you wil build with the inlang SDK. The possibilities are near endless – like a Chrome extension, a Sketch plugin, a Translation Analytics tool? Happy coding! 