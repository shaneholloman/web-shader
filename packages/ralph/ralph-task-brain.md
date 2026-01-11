# Ralph Task Brain 🧠

> **This file is the living memory for implementing `@ralph/core`.**  
> Update it after each work session to maintain context across conversations.

---

## How to Use This File

### For AI Assistants

1. **Read this file first** when starting any work on `@ralph/core`
2. **Check "Current Status"** to understand where we are
3. **Pick a task from "Next Tasks"** and move it to "In Progress"
4. **Update "Implementation History"** after completing work
5. **Add learnings** to the "Learnings & Decisions" section
6. **Update "Current Status"** before ending the session

### For Humans

- Reference this file to see progress on the Ralph implementation
- Add new tasks to "Future Tasks" if you have ideas
- Review "Learnings & Decisions" for architectural context

---

## Current Status

| Aspect | Status |
|--------|--------|
| **Phase** | Not Started |
| **Last Updated** | 2026-01-11 |
| **Blockers** | None |
| **Next Action** | Set up package structure |

---

## Implementation History

### Completed Tasks

_No tasks completed yet._

<!-- 
Template for completed tasks:

#### ✅ [Task Name] — [Date]
**What was done:**
- Item 1
- Item 2

**Files created/modified:**
- `src/file.ts`

**Notes:**
Any relevant context for future reference.
-->

---

## In Progress

_No tasks in progress._

<!-- 
Template:

#### 🔄 [Task Name]
**Started:** [Date]
**Status:** [Description of current state]
**Remaining:**
- [ ] Sub-task 1
- [ ] Sub-task 2
-->

---

## Next Tasks

### Phase 1: Foundation (Priority: High)

1. **Set up package structure**
   - Initialize `package.json` with proper config
   - Set up TypeScript (`tsconfig.json`)
   - Configure build (tsup or similar)
   - Add basic test setup (vitest)

2. **Define core types** (`src/types.ts`)
   - `LoopAgentConfig`
   - `RalphStatus`
   - `RalphResult`
   - `RalphError`
   - `Iteration`
   - `ContextFile`
   - `StuckContext`
   - `Sandbox` interface

3. **Implement Sandbox interface** (`src/sandbox/interface.ts`)
   - Define the abstract interface
   - Create a mock sandbox for testing

### Phase 2: Core Loop (Priority: High)

4. **Implement ProcessManager** (`src/managers/process.ts`)
   - Start/stop processes
   - Auto-cleanup idle processes
   - Process output capture
   - Graceful shutdown (SIGTERM → SIGKILL)

5. **Implement BrowserManager** (`src/managers/browser.ts`)
   - Playwright integration
   - Console error capture
   - Screenshot management
   - Auto-close on cleanup

6. **Implement core tools**
   - `exec` tool (`src/tools/exec.ts`)
   - `startProcess` / `stopProcess` / `listProcesses` (`src/tools/process.ts`)
   - `readFile` / `writeFile` / `listFiles` (`src/tools/filesystem.ts`)
   - `openBrowser` / `screenshot` / `interact` / `closeBrowser` (`src/tools/browser.ts`)
   - `done` tool (`src/tools/done.ts`)

7. **Implement the main loop** (`src/loop.ts`)
   - Iteration execution
   - Completion checking
   - Process cleanup between iterations

### Phase 3: Agent & Detection (Priority: Medium)

8. **Implement StuckDetector** (`src/stuck/detector.ts`)
   - Repetitive actions detection
   - Error loop detection
   - Oscillation (A-B-A-B) detection
   - Empty iteration detection

9. **Implement LoopAgent class** (`src/agent.ts`)
   - Configuration handling
   - Run/stop/nudge methods
   - Status/history getters
   - Callback invocation

10. **Implement Git operations** (`src/git/operations.ts`)
    - Clone repository
    - Per-iteration commits
    - Push on completion
    - PR creation (optional)

### Phase 4: Polish (Priority: Low)

11. **System prompt construction**
    - Default prompt template
    - Rules injection
    - Context file injection

12. **Error handling**
    - `RalphError` class
    - Error codes
    - Recovery logic

13. **Testing suite**
    - Unit tests for each module
    - Integration tests with mock sandbox
    - Stuck detection tests

14. **Documentation**
    - README.md
    - API documentation
    - Usage examples

---

## Future Tasks

_Ideas for later, not prioritized yet._

- Vercel Sandbox implementation (`@ralph/sandbox-vercel`)
- E2B Sandbox implementation (`@ralph/sandbox-e2b`)
- Local Docker sandbox for testing (`@ralph/sandbox-local`)
- Checkpointing / resume functionality
- Parallel execution support
- Token streaming for live output
- Metrics / observability hooks

---

## Learnings & Decisions

### Architectural Decisions

_Document key decisions made during implementation._

<!-- 
Template:

#### [Decision Title]
**Date:** [Date]
**Context:** Why this decision was needed
**Decision:** What we decided
**Rationale:** Why we chose this approach
**Alternatives considered:** Other options we evaluated
-->

### Technical Learnings

_Document gotchas, patterns, or insights discovered._

<!-- 
Template:

#### [Learning Title]
**Context:** What we were trying to do
**Learning:** What we discovered
**Impact:** How this affects the implementation
-->

### Open Questions

_Things we're uncertain about that need resolution._

- How should we handle model selection? Pass provider + model separately or combined string?
- Should sandbox implementations be in the same package or separate?
- What's the best way to handle Playwright in a sandbox environment?

---

## Reference Links

- **Spec file:** `packages/ralph/promt.md`
- **Similar projects to study:**
  - Vercel AI SDK
  - LangChain agents
  - AutoGPT / AgentGPT patterns

---

## Session Log

_Brief notes from each work session._

<!-- 
Template:

### [Date] — [Duration]
**Focus:** What was worked on
**Outcome:** What was accomplished
**Next:** Suggested next steps
-->

### 2026-01-11 — Initial Setup
**Focus:** Created task tracking file
**Outcome:** `ralph-task-brain.md` created with full task breakdown
**Next:** Set up package structure (package.json, tsconfig.json, build config)
