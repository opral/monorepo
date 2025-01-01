# The Problem: Isolated Tooling

A globalized project involves numerous personas, each using its own set of tools. From developers working with code to designers focusing on user interfaces and translators dealing with language nuances, the diversity in tooling creates a disjointed workflow.

<img src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/guides/ecosystem-compatible/assets/compatible-problem.png" alt="problem"></img>

### 1. Implementation Overhead

Connecting these disparate tools often requires elaborate pipelines, leading to implementation overhead. This complexity increases with the number of personas involved, making the development and maintenance of the i18n process challenging.

### 2. Lack of Communication

Isolated tooling hampers communication between different personas. The absence of seamless communication channels results in duplicated efforts, unnecessary work, and a lack of synergy in achieving global conversion.

### 3. The misconception of i18n as a One-off Task

The traditional view of i18n as a one-time task rather than a continuous process contributes to the problem. In reality, every development feature requires collaboration among various personas and approvals to achieve optimal global conversion.

## The Solution: Different Users, Different Tools, One Project

The inlang ecosystem compatibility offers a solution by providing a unified way for different users with diverse tools to collaborate on a single project. This eliminates the need for complicated integration processes and ensures that all parties collaborate effectively.

<img src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/guides/ecosystem-compatible/assets/compatible-solution.png" alt="problem"></img>

### Centralized Source of Truth

Inlang-compatible apps and libraries operate seamlessly with a centralized source of truth stored in a project. This allows for efficient collaboration and eliminates the need for additional continuous integration (CI) pipelines and syncing processes.

### Overcoming External Tooling Challenges

Using external tooling often requires establishing additional CI pipelines and syncing processes, and in some cases, integration with other ecosystem products may not even be possible. The inlang ecosystem compatibility simplifies this by providing a unified platform that inherently understands the semantics of the repository and its files.

## Example: Classic i18n Stack vs. Inlang Ecosystem

### Classic i18n Stack

Global projects traditionally require a combination of i18n libraries, translation editors, and IDE extensions. In the inlang ecosystem, using tools like [Paraglide JS](https://inlang.com/m/gerre34r), [Fink](https://inlang.com/m/tdozzpar), and [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) – a helpful i18n VS Code extension which streamlines the process with a single project configuration. This unified approach eliminates the need for additional plugins and syncing jobs, providing a seamless development experience.

### External Tooling Challenges

When relying on external tools, the development process becomes more challenging. Additional plugins and syncing jobs are necessary, leading to increased maintenance and initial development costs. The lack of inherent semantic understanding of the repository and files further complicates the integration.
