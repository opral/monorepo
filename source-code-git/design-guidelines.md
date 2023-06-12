# Project Lisa Design Guidelines

### 1. Derive requirements from inlang.

If a proposed feature is not useful to inlang, it is likely not useful in general.

Building a new version control system with uncertain requirements and "feature X could be amazing [but it is not for inlang]" thinking increases the risk build a system that is not useful. Inlang is the first application built on project lisa with a clear set of requirements. Using inlang's requirements to build lisa will increase the probabilty to build a useful, and potentially game-changing, version control system.

### 2. The filesystem is the universal data API

Read a file, write a file, simple. 

The backend logic between different (file-based) applications does not differ. If app A writes a file, app B can read and operate on that file too. The moment project lisa breaks the "filesystem is the universal data API constraint", interop is lost. This Loom video illustrates the benefits of "lisa operates on files" https://www.loom.com/share/f3beba7d8ee444c5bc0dde8b5ad41624.

### 3. Iteration speed over pre-mature performance optimization (TypeScript first, WebAssembly if needed).

To de-risk design decisions that could de-rail the project, iteration speed is crucial.

One of the reasons why using TypeScript is the primary language. Using TypeScript as the primary language ensures compatibility with the rest of the codebase, is higher level (faster to iterate), and cross-app debugging is easier. If performance is needed, WebAssembly can be used to offload performance limiting computations.

### 4. Don't assume tech stack choices of users.

To future-proof project lisa and de-risk the project, project lisa should not assume a tech stack choice e.g. only works for React or Node or Express, etc. We don't know what tech stacks will be used with lisa yet and even if we did know, tech stack choices change over time. 


