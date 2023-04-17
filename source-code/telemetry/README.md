# @inlang/telemetry

Telemetry module that can be used throughout the monorepo and help us to build better products.

The module exists because:

- we need conditional logic if the env variable of the posthog token exists. Otherwise, contributors will face numerous errors. The conditional logic should be handled by the telemetry module.
- telemetry is used throughout the codebase and it is easier to import a module than to import and configure the posthog library.

## Usage

The implementation is a wrapper around the [PostHog JS](https://posthog.com/docs/libraries/js) and [PostHog Node](https://posthog.com/docs/libraries/node) libraries.

**Browser**

A top-level initialization is required.

```js
import { telemetryBrowser } from "@inlang/telemetry"

// initialize the telemetry module at the start of the browser application
telemetryBrowser.init()

// capture events
telemetryBrowser.capture()
```

**Node**

Auto initializes when capture is called.

```js
import { telemetryNode } from "@inlang/telemetry"

// capture events
telemetryNode.capture()
```
