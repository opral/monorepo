# Project Lisa Design Guidelines

### 1. Derive requirements from inlang.

If a proposed feature is not useful to inlang, it is likely not useful in general.

Building a new version control system with uncertain requirements and "feature X could be amazing [but it is not for inlang]" thinking increases the risk build a system that is not useful. Inlang is the first application built on project lisa with a clear set of requirements. Using inlang's requirements to build lisa will increase the probabilty to build a useful, and potentially game-changing, version control system.

### 2. TypeScript first, WebAssembly if needed.

Faster iteration speed over pre-mature performance optimization.

Using TypeScript is the primary language ensures compatibility with the rest of the codebase, is higher level (faster to iterate), and cross-app debugging is easier. If performance is needed, WebAssembly can be used to offload performance limiting computations.

### 3. JavaScript (TypeScript) runtime agnostic

To future-proof project lisa and de-risk the project, project lisa should be runtime agnostic.

The client has to be runtime agnostic to run in the browser. But, even the server should be runtime agnostic to accustom new WebApps paradigms like serverless computing and runtimes like Deno.
