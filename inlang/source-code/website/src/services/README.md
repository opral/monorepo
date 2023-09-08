# #src/services

Services are "services" that are not core of inlang but are required to build inlang.

## Structure of services

```
.
├── src (contains the implementation of the service)/
│ ├── ...
│ ├── ...
│ └── ...
├── index.ts (exports that work on both client and server)
├── index.client.ts (exports that only work on the client)
└── index.server.ts (exports that only work on the server)
```
