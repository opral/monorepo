# Lix (previously Project Lisa)

Lix is the git compatible data layer for inlang apps.

We build lix to bring developers and non technical editors together without sacrificing the power of full version control.

We will also support other usecases for many applications with a
"create > review > automate" flow:

Examples for great lix apps (some require a later binary support layer):
  - markdown editors
  - bookkeeping
  - editors for manuals
  - figma files
  - versioned spreadsheets
  - CAD
  - jupyter notebooks or linked datasets
  - colocated bug tickets in an sqlite db in the repo

##  Design Principles

### 1. File-based.

#### The filesystem is the universal data API.

If apps A (e.g. CLI) and B (e.g. IDE) operate on files, both apps have interop.
Read a file, write a file, simple. The moment project lix breaks this
constraint, interop is lost. This Loom video illustrates the benefits of "lix
operates on files" https://www.loom.com/share/f3beba7d8ee444c5bc0dde8b5ad41624.

### 2. Git compatible.

#### Without git compatibility, no adoption.

Git is the most widely used version control system. If project lix is not git
compatible, the wide ecosystem of git repositories can't be leveraged, and
inlang wouldn't exist.

### 3. Host Agnostic.

#### Locking ourselves into a git host means locking ourselves into their userbase.

If GitHub were to disappear tomorrow, project lix should not disappear with
it. Likewise, if a new git host appears and sees widespread adoption, lix
should work with it out of the box, without us needing to scramble to implement
support.

### 4. Designed for inlang.

#### If a proposed feature is not useful to inlang, it is likely not useful in general.

Building a new version control system with uncertain requirements and "feature
X could be amazing [but it is not for inlang]" thinking increases the risk of
building a system that is not useful. Inlang is the first application built on
project lix with a clear set of requirements. Using inlang's requirements to
build lix will increase the probability of building a useful and potentially
game-changing version control system.

### 5. Flexible, then fast.

#### Iteration speed should be valued over (premature) optimization.

Iteration speed is crucial to de-risk design decisions that could de-rail the
project. One of the reasons why using TypeScript is the primary language. Using
TypeScript as the primary language ensures compatibility with the rest of the
codebase, is higher level (faster to iterate), and cross-app debugging is
easier. If performance is needed, WebAssembly can be used to offload
performance-limiting computations.
