# @inlang/shared

This module contains sub-modules that are shared across inlang apps. Apps differ from modules
in that they are not meant to be used as a dependency, but rather as a standalone app. Examples for apps are the CLI, IDE extension, or editor.

- [rpc](./lib/rpc/) - Contains RPC functions (functions that are run on the server)
- [telemetry]('./lib/telemetry') - Contains telemetry functions that can be used across the codebase.
