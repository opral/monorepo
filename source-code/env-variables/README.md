# @inlang/env-variables

This module contains the implementation for environment variables that are used throughout the monorepo.

The main motivation to have a dedicated env variables module is to align env variables across the monorepo and enable external contributors to easily get started with the codebase.

## Usage

```ts
// in client facing apps
import { publicEnv } from "@inlang/env-variables"
```

```ts
// in server facing apps
import { privateEnv } from "@inlang/env-variables"
```

## Defining environment variables

Add environment variables in [./schema.ts](./schema.ts).

## Architecture

**Requirements**

- Typesafe to avoid runtime errors.
- Allow contributors to easily get started with the codebase (fetch remote env variables). Requiring contributors to set up a local .env file or a service like Doppler is out of the question.
- Consumable in all environments (editor, ide extension, cli, server).
- Validation on deployment to fail fast if env variables are missing.
- "MissingEnvVariable" runtime errors in development to provide developers with a clear error message.

**Solution**

- Public env variables are identified by a `PUBLIC_` prefix and injected into the bundle by the build process.
- Private env variables are retrieved from process.env. They are not injected into the bundle and thereby (shouldn't) leak.
- If no root .env file is found, the public development env variables are fetched from a remote server.
