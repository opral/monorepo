# Project Lisa Design Principles

#### 1. Derive requirements from inlang.

If a proposed feature is not useful to inlang, it is likely not useful in general.

#### 2. Don't break filesystem interop. 

If apps A (e.g. CLI) and B (e.g. IDE) operate on files, both apps have interop. Read a file, write a file, simple. 

#### 3. Git compatible.

Without git compatibility, no adoption. 

#### 4. Iteration speed over optimization. 

Iteration speed is crucial to de-risk design decisions that could de-rail the project. Thus, high level scripting language (TypeScript) with WASM if required.  
