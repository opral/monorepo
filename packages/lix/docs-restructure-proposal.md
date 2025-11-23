# Lix Documentation Restructure Proposal

## Analysis of Current Structure Issues

### Current Problems
1. **"Most Used Features" vs "More Features"** - Arbitrary split based on popularity, not logical grouping
2. **"Concepts" section** - Mixes fundamental concepts (Entity, Schema) with implementation details (Persistence, Environment API)
3. **"Development & Debugging"** - Unclear distinction from "Concepts"
4. **Feature discoverability** - Users struggle to find related features scattered across sections

## Best Practice Documentation Framework

Modern technical documentation follows the **Divio Documentation System** (also called Documentation Quadrants), which organizes content by user intent:

1. **Tutorials** - Learning-oriented, step-by-step lessons
2. **How-to Guides** - Task-oriented, problem-solving recipes
3. **Explanation** - Understanding-oriented, theory and concepts
4. **Reference** - Information-oriented, technical specifications

## Benchmarked Documentation Structures

### Liveblocks (Real-time Collaboration - Conversion Optimized) ⭐
**Structure:** Getting Started → Concepts → Ready-made Features → Tools → Platform → API Reference

**Current lix structure was inspired by Liveblocks.**

```
Getting Started/      # Quick entry
  - Overview
  - Get started
  - Authentication

Concepts/             # MINIMAL - just 2 pages!
  - Why Liveblocks
  - How Liveblocks works

Ready-made Features/  # Single flat list of capabilities
  - AI Copilots       # Each feature has subsections:
  - Comments          #   - Concepts
  - Multiplayer Editing #   - Usage
  - Notifications     #   - Hooks/API
  - Presence          #   - Customization
                      #   - Email notifications

Tools/                # Developer tooling
  - DevTools
  - Next.js Starter Kit
  - MCP server

Platform/             # Infrastructure & operations
  - Data storage
  - WebSocket infrastructure
  - Analytics
  - Webhooks

API Reference/        # Auto-generated
```

**Why this works:**
- ✅ **Conversion-focused** - Users immediately see what they can build
- ✅ **No arbitrary groupings** - All features equal, flat structure
- ✅ **Minimal concepts** - Just enough to understand, not overwhelming
- ✅ **Each feature is self-contained** - Complete vertical with all info needed
- ✅ **Clear separation** - Features vs Tools vs Platform vs API

**Key insight:** Liveblocks keeps Concepts to just 2 pages and leads with features users can build. Implementation details (persistence, testing, etc.) are in separate "Tools" section.

### Automerge (CRDT Collaboration - Most Similar to Lix)
**Structure:** Tutorial → Guides → Cookbook → Reference

```
Tutorial/          # Step-by-step learning path
  - Setup and core concepts
  - Local storage, syncing
  - Framework integration (React)
  - Network synchronization

Guides/            # Specialized topics
  - Migration guides
  - Using with LLMs

Cookbook/          # Practical implementations
  - Data modeling patterns
  - Rich text editors

Reference/         # Technical documentation
  - Concepts and initialization
  - Core features (documents, repositories)
  - Under the hood
  - API documentation
```

**Why this works:** Clear progression from learning → practical tasks → deep understanding → lookup

### Yjs (Collaboration Library)
**Structure:** Getting Started → Ecosystem → API → Tutorials

```
Getting Started/   # Core concepts with hands-on examples
  - Collaborative Editor
  - Awareness & Presence
  - Offline Support
  - Shared Types

Ecosystem/         # Integration points
  - Editor Bindings
  - Connection Providers
  - Database Providers

API/               # Complete technical reference

Tutorials/         # Advanced patterns
  - Meshing Providers
  - Persisting Documents
  - Custom Provider Development
```

**Why this works:** Combines learning with ecosystem discovery, separates API reference cleanly

### Drizzle ORM (Database Library)
**Structure:** Getting Started → Fundamentals → Connect → Access Your Data → Advanced

```
Getting Started/   # Why, Guides, Tutorials
Fundamentals/      # Core concepts (Schema, Connection, Query, Migrations)
Connect/           # Environment-specific setup
Manage Schema/     # Task-oriented schema operations
Access Your Data/  # Task-oriented CRUD operations
Performance/       # Optimization guides
Advanced/          # Complex patterns
```

**Why this works:** Organizes by user journey (learn → understand → connect → use → optimize)

### Prisma (Database Toolkit)
**Structure:** Getting Started → ORM → Guides → Reference

```
Getting Started/   # Quick wins
ORM/               # Core product docs
  - Concepts
  - Guides (task-oriented)
  - Reference

Guides/            # Framework and integration guides
```

**Why this works:** Product-focused with clear separation of concepts, tasks, and reference

### tRPC (Type-safe API)
**Structure:** Getting Started → Concepts → Backend Usage → Client Usage → Reference

```
Getting Started/   # Quickstart
Concepts/          # Core understanding
Backend Usage/     # Server-side guides
Client Usage/      # Client-side guides
Reference/         # API documentation
```

**Why this works:** Separates by environment (backend/client) after establishing concepts

## Recommended Structure for Lix

Based on Liveblocks' conversion-optimized approach and establishing "change control" as the core framework:

```
Getting Started/
  - What is Lix?
  - Quick Start
  - Lix for AI Agents

Concepts/                    # Minimal (2-3 pages, inspired by Liveblocks)
  - How Lix Works            # High-level overview
  - Data Model               # Entity, Schema, Change Sets
  - Architecture             # How pieces fit together

Change Control/              # Flat list - core version control features
  - Versions (Branching)     # Parallel work, experimentation
  - History                  # View past changes
  - Diffs                    # Compare states
  - Attribution (Blame)      # Who made what change
  - Change Proposals         # Review & approval workflows
  - Validation Rules         # Quality gates
  - Undo/Redo                # Step through changes
  - Restore                  # Time travel to previous states

Additional Features/         # Auxiliary capabilities
  - Conversations            # Discuss changes
  - Labels                   # Tag & organize
  - Key-Value Store          # Custom metadata

Guides/                      # Implementation & operations
  - Persistence              # Disk, cloud, database, browser, in-memory
  - Environment API          # Where Lix runs (Node, browser, workers)
  - Testing                  # Test strategies
  - React Integration        # React Utils
  - Logging & Debugging      # Troubleshooting
  - Deterministic Mode       # Reproducible behavior

Advanced/                    # Complex patterns & optimization
  - Custom Validation Rules
  - Performance Optimization
  - Custom Metadata Schemas

API Reference/
  - [Auto-generated from TypeDoc]

Examples/
  - [Keep existing examples structure]
```

## Rationale for Each Section

### Getting Started (3 pages)
**Purpose:** Help users decide if Lix is right for them and get running quickly
**User intent:** "Should I use this? How do I start?"
- What is Lix establishes value proposition
- Quick Start provides first success in < 5 minutes
- AI Agents shows unique use case

**Best practice reference:** All surveyed docs, especially Liveblocks' Getting Started

### Concepts (2-3 pages)
**Purpose:** Minimal foundational understanding
**User intent:** "How does this work at a high level?"
- High-level overview only
- Core mental models (Entity, Schema, Change Sets)
- No implementation details
- **Keep this section SMALL** - resist urge to add more

**Best practice reference:** Liveblocks (just 2 pages!), Prisma's Concepts

**Why minimal?** Following Liveblocks' conversion-optimized approach: users want to see what they can build (features), not get bogged down in theory upfront.

### Change Control (8 pages)
**Purpose:** Core version control capabilities - what you can build
**User intent:** "What can I do with Lix?"
- Flat list, no subsections (avoids arbitrary groupings)
- Each page is self-contained with:
  - What it is / why use it
  - Interactive examples
  - Links to API reference
- Scannability: users see all capabilities at same level

**Best practice reference:** Liveblocks' "Ready-made Features" - flat list of 5 features

**Why flat?** Avoids the arbitrary "Most Used vs More" or "Basics vs Advanced" splits. All features are equally important and discoverable.

### Additional Features (3 pages)
**Purpose:** Auxiliary capabilities beyond core version control
**User intent:** "What else can Lix do?"
- Keeps Change Control focused on version control
- Conversations, Labels, KV Store are metadata/collaboration tools
- Same format as Change Control pages

**Why separate?** Maintains clarity that these are complementary to core change control, not part of the version control system itself.

### Guides (6 pages)
**Purpose:** Implementation, operations, and integration
**User intent:** "How do I integrate Lix? Where does it run?"
- Persistence: how to save/load Lix
- Environment API: where Lix runs (Node, browser, workers)
- Testing, React, Logging, Deterministic Mode
- Task-oriented, assumes basic Lix knowledge

**Best practice reference:** Liveblocks' "Tools" section, Drizzle's implementation guides

**Why separate from features?** These are about "where and how" to run Lix, not "what" you can do with it.

### Advanced (Open-ended)
**Purpose:** Complex patterns, optimization, edge cases
**User intent:** "I need to do something complex or custom"
- Custom implementations
- Performance tuning
- Not for beginners

**Best practice reference:** Drizzle's Advanced section

### API Reference
**Purpose:** Technical lookup
**User intent:** "What parameters does this function take?"
- Auto-generated from TypeDoc
- Not for learning
- Complete technical specs

**Best practice reference:** All surveyed docs separate this

## Key Improvements Over Current Structure

### 1. No Arbitrary Feature Splits (Inspired by Liveblocks)
**Before:** "Most Used Features" vs "More Features" (arbitrary popularity split)
**After:** "Change Control" (flat list of 8 core features) + "Additional Features" (3 auxiliary features)
**Better because:**
- No artificial hierarchy suggesting some features are "less important"
- All features equally discoverable at same navigation level
- Clear separation: core version control vs auxiliary capabilities
- Users can scan all options without expanding multiple sections

### 2. Minimal Concepts Section (Inspired by Liveblocks)
**Before:** "Concepts" contains 6+ pages mixing theory (Entity, Schema) and implementation (Persistence, Environment API, Writer Key, Metadata)
**After:** "Concepts" has just 2-3 pages of high-level overview
- How Lix Works (overview)
- Data Model (Entity, Schema, Change Sets)
- Architecture (how pieces fit)

**Better because:**
- Users get to "what can I build" faster (conversion-focused)
- Implementation details moved to "Guides" where they belong
- Follows Liveblocks' pattern: minimal concepts, feature-first

### 3. "Change Control" as Core Framework
**Before:** Features scattered across "Most Used" and "More" without clear organizing principle
**After:** "Change Control" establishes Lix's core value proposition
- 8 version control features under one clear category
- Reinforces mental model: Lix = change control system
- Easy to explain: "Lix provides these 8 change control capabilities"

**Better because:**
- Clear brand/value proposition
- User understands what Lix is for
- Natural grouping based on what Lix does, not arbitrary usage stats

### 4. Implementation Separate from Features
**Before:** "Concepts" mixed with "Development & Debugging" - unclear boundaries
**After:** Clear separation:
- "Change Control" = what you can do
- "Guides" = how to integrate/operate (persistence, testing, environments)
- "Advanced" = complex customization

**Better because:**
- Users can learn features without getting overwhelmed by deployment details
- Natural progression: understand features → integrate into app → customize
- Matches Liveblocks' "Features" vs "Tools" separation

### 5. Flat Navigation Structure
**Before:** Multiple nested subsections (Change Management/Versioning & History/Collaboration/etc.)
**After:** Flat lists within each top-level section
- Getting Started (3 pages)
- Concepts (2-3 pages)
- Change Control (8 pages, no nesting)
- Additional Features (3 pages, no nesting)
- Guides (6 pages, no nesting)

**Better because:**
- Reduced cognitive load - no need to understand arbitrary subsection groupings
- Better scannability - see all options at once
- Easier to maintain - adding features doesn't require reorganization
- Follows Liveblocks' successful pattern

## Migration Path

### Phase 1: Reorganize Files
```bash
# Create new structure
mkdir -p docs/getting-started
mkdir -p docs/concepts
mkdir -p docs/change-control
mkdir -p docs/additional-features
mkdir -p docs/guides
mkdir -p docs/advanced

# Getting Started (3 files)
# - what-is-lix.md (new or update existing)
# - quick-start.mdx (update existing getting-started.mdx)
# - lix-for-ai-agents.md (move from guide/ai-agent-collaboration.md)

# Concepts (2-3 files)
# - how-lix-works.md (new - high level overview)
# - data-model.md (combine entity.md + schema.md concepts only)
# - architecture.md (keep existing)

# Change Control (8 files - flat, no subdirs)
mv docs/guide/versions.mdx docs/change-control/
mv docs/guide/history.mdx docs/change-control/
mv docs/guide/diffs.mdx docs/change-control/
mv docs/guide/attribution.mdx docs/change-control/
mv docs/guide/change-proposals.mdx docs/change-control/
mv docs/guide/validation-rules.md docs/change-control/
mv docs/guide/undo-redo.mdx docs/change-control/
mv docs/guide/restore.mdx docs/change-control/

# Additional Features (3 files - flat)
mv docs/guide/conversations.md docs/additional-features/
mv docs/guide/concepts/labels.md docs/additional-features/
mv docs/guide/concepts/key-value.md docs/additional-features/

# Guides (6 files - flat)
mv docs/guide/persistence.md docs/guides/
mv docs/guide/environment-api.md docs/guides/
mv docs/guide/testing.md docs/guides/
mv docs/guide/react-utils.mdx docs/guides/react-integration.mdx
mv docs/guide/logging.md docs/guides/
mv docs/guide/deterministic-mode.md docs/guides/

# Advanced (move later as needed)
# - Custom validation rules
# - Performance optimization
# - Custom metadata schemas
```

### Phase 2: Update rspress.config.ts
Update sidebar configuration to match new flat structure:
```typescript
sidebar: {
  "/": [
    {
      text: "Getting Started",
      items: [
        { text: "What is Lix?", link: "/getting-started/what-is-lix" },
        { text: "Quick Start", link: "/getting-started/quick-start" },
        { text: "Lix for AI Agents", link: "/getting-started/lix-for-ai-agents" },
      ],
    },
    {
      text: "Concepts",
      items: [
        { text: "How Lix Works", link: "/concepts/how-lix-works" },
        { text: "Data Model", link: "/concepts/data-model" },
        { text: "Architecture", link: "/concepts/architecture" },
      ],
    },
    {
      text: "Change Control",
      collapsed: false, // Keep visible by default
      items: [
        { text: "Versions (Branching)", link: "/change-control/versions" },
        { text: "History", link: "/change-control/history" },
        { text: "Diffs", link: "/change-control/diffs" },
        { text: "Attribution (Blame)", link: "/change-control/attribution" },
        { text: "Change Proposals", link: "/change-control/change-proposals" },
        { text: "Validation Rules", link: "/change-control/validation-rules" },
        { text: "Undo/Redo", link: "/change-control/undo-redo" },
        { text: "Restore", link: "/change-control/restore" },
      ],
    },
    {
      text: "Additional Features",
      items: [
        { text: "Conversations", link: "/additional-features/conversations" },
        { text: "Labels", link: "/additional-features/labels" },
        { text: "Key-Value Store", link: "/additional-features/key-value" },
      ],
    },
    {
      text: "Guides",
      items: [
        { text: "Persistence", link: "/guides/persistence" },
        { text: "Environment API", link: "/guides/environment-api" },
        { text: "Testing", link: "/guides/testing" },
        { text: "React Integration", link: "/guides/react-integration" },
        { text: "Logging & Debugging", link: "/guides/logging" },
        { text: "Deterministic Mode", link: "/guides/deterministic-mode" },
      ],
    },
    {
      text: "Advanced",
      collapsed: true,
      items: [
        // Add as needed
      ],
    },
  ],
  "/api/": generateApiSidebar(path.join(__dirname, "docs")),
}
```

### Phase 3: Content Updates
1. **Create "How Lix Works"** - New high-level overview page (2-3 min read)
2. **Update "Quick Start"** - Ensure < 5 minute first success
3. **Create "Data Model"** - Combine Entity + Schema concepts (theory only)
4. **Update Change Control pages** - Ensure each has:
   - Clear "what it is / why use it"
   - Interactive examples
   - Links to API reference
5. **Update Guides** - Ensure task-oriented with clear outcomes
6. **Update internal links** throughout documentation

### Phase 4: Redirects
Add redirects for old URLs to maintain existing links:
```typescript
// In rspress.config.ts or separate redirects file
redirects: [
  { from: '/guide/getting-started', to: '/getting-started/quick-start' },
  { from: '/guide/entity', to: '/concepts/data-model' },
  { from: '/guide/schema', to: '/concepts/data-model' },
  { from: '/guide/concepts/labels', to: '/additional-features/labels' },
  { from: '/guide/concepts/key-value', to: '/additional-features/key-value' },
  // ... add more as needed
]
```

## Success Metrics

After restructuring, documentation should achieve:
1. **Faster time-to-first-success** - Getting Started completes in < 5 minutes
2. **Better feature discovery** - Users find related features together
3. **Clearer learning path** - Natural progression from Introduction → Tutorial → Guides → Advanced
4. **Reduced support questions** - Common tasks have clear, findable guides

## References

Documentation examples analyzed:
- [Liveblocks Documentation](https://liveblocks.io/docs) ⭐ (Primary inspiration - conversion optimized)
- [Automerge CRDT Documentation](https://automerge.org/docs/hello/)
- [Yjs Documentation](https://docs.yjs.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/get-started)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)

Documentation best practices:
- [Divio Documentation System](https://docs.divio.com/documentation-system/)
- The Good Docs Project
- Write the Docs community resources

## Summary of Changes

**Compared to current lix structure:**
1. ✅ Remove "Most Used Features" vs "More Features" split
2. ✅ Create "Change Control" section (8 core features, flat list)
3. ✅ Create "Additional Features" section (3 auxiliary features)
4. ✅ Minimize "Concepts" to 2-3 pages (was 6+ pages)
5. ✅ Move implementation to "Guides" (Persistence, Environment API, Testing, React, Logging, Deterministic Mode)
6. ✅ Remove nested subsections - everything flat
7. ✅ Establish "change control" as core framework/value proposition

**Inspired by Liveblocks:**
- Minimal Concepts section (2 pages vs 6+)
- Feature-first organization (what you can build)
- Flat structure within sections (no nested groupings)
- Clear separation: Features vs Implementation (Guides)
- Conversion-focused: get users building faster
