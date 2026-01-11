# @ralph/core

## Autonomous Agent Loop Library - Technical Specification v1.0

---

## Overview

`@ralph/core` is a TypeScript library for running autonomous AI coding agents in isolated sandbox environments. It implements the "Ralph Wiggum" pattern: a simple loop that feeds tasks to an AI model until completion, with robust process management, visual verification, and stuck detection.

### Design Principles

1. **Dumb but reliable** — the agent loop is simple; intelligence comes from the task description
2. **Safe** — managed processes, automatic cleanup, cost limits, circuit breakers
3. **Observable** — real-time status updates, iteration history, stuck detection
4. **Composable** — works with any sandbox provider (Vercel Sandbox, E2B, etc.)

### What Ralph Is NOT

- Ralph is not smart — he follows instructions literally
- Ralph does not make architectural decisions — he executes tasks
- Ralph does not have memory across runs — each run is fresh
- Ralph is not a chat interface — he's a headless worker

---

## Quick Start

```typescript
import { LoopAgent } from "@ralph/core";
import { VercelSandbox } from "@ralph/sandbox-vercel";

const agent = new LoopAgent({
  sandbox: new VercelSandbox(),
  model: "claude-sonnet-4-20250514",
  task: "Fix all TypeScript errors in src/",
  repo: {
    url: "https://github.com/user/repo",
    branch: "fix-types",
  },
  limits: {
    maxIterations: 50,
    maxCost: 5.0,
    timeout: "2h",
  },
});

const result = await agent.run();

console.log(result.success); // true
console.log(result.iterations); // 12
console.log(result.cost); // 1.34
console.log(result.summary); // "Fixed 7 type errors..."
```

---

## Core Concepts

### The Loop

At its heart, Ralph is a while loop. Each iteration:

1. Read the task and context
2. Let the AI work with tools (filesystem, terminal, browser)
3. Check for completion
4. Check if stuck
5. Cleanup idle processes
6. Repeat

```
┌─────────────────────────────────────────────────────────────┐
│                      RALPH LOOP                             │
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Read   │───▶│  Work   │───▶│  Check  │───▶│ Cleanup │  │
│  │  Task   │    │  Tools  │    │  Done?  │    │         │  │
│  └─────────┘    └─────────┘    └────┬────┘    └────┬────┘  │
│       ▲                             │              │       │
│       │                             │ No           │       │
│       └─────────────────────────────┴──────────────┘       │
│                                     │ Yes                   │
│                                     ▼                       │
│                              ┌─────────────┐                │
│                              │   Commit    │                │
│                              │   & Push    │                │
│                              └─────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Tools vs Raw Bash

Ralph doesn't give the AI raw bash access. Instead, it provides **managed tools** that handle:

- Long-running processes (dev servers don't hang)
- Port management (no duplicate servers)
- Automatic cleanup (no zombie processes)
- Browser automation (visual verification)

### Completion Detection

Ralph supports multiple completion strategies:

| Strategy  | Description                                 |
| --------- | ------------------------------------------- |
| `file`    | A specific file exists (default: `DONE.md`) |
| `command` | A command exits with code 0                 |
| `custom`  | Your own async function                     |

### Stuck Detection

Ralph detects when he's spinning without progress:

- Same files modified 3+ iterations with no new changes
- Same error repeated 3+ times
- High token usage with no file output
- A-B-A-B oscillation patterns

---

## API Reference

### LoopAgent

The main class for creating and running agent loops.

```typescript
import { LoopAgent } from '@ralph/core'

const agent = new LoopAgent(config: LoopAgentConfig)
```

#### LoopAgentConfig

```typescript
interface LoopAgentConfig {
  // === REQUIRED ===

  /** Sandbox instance for isolated execution */
  sandbox: Sandbox;

  /** AI model identifier (e.g., 'claude-sonnet-4-20250514') */
  model: string;

  /** The task description - what Ralph should accomplish */
  task: string;

  /** Repository configuration */
  repo: {
    /** Git URL (HTTPS) */
    url: string;
    /** Branch to work on (created if doesn't exist) */
    branch: string;
    /** Base branch to branch from (default: 'main') */
    baseBranch?: string;
    /** GitHub token for auth (or use environment) */
    token?: string;
  };

  // === LIMITS ===

  limits?: {
    /** Max loop iterations (default: 50) */
    maxIterations?: number;
    /** Max cost in USD (default: 10.00) */
    maxCost?: number;
    /** Max runtime (default: '4h') */
    timeout?: string | number;
    /** Max tokens per iteration (default: 100000) */
    maxTokensPerIteration?: number;
  };

  // === COMPLETION ===

  /** How to detect completion */
  completion?: {
    /** Strategy: 'file' | 'command' | 'custom' */
    type: "file" | "command" | "custom";
    /** For 'file': path to check (default: 'DONE.md') */
    file?: string;
    /** For 'command': command that should exit 0 */
    command?: string;
    /** For 'custom': async function */
    check?: (context: CompletionContext) => Promise<CompletionResult>;
  };

  // === CONTEXT ===

  /** Additional context files to include in each iteration */
  context?: ContextFile[];

  /** Rules/guidelines for the agent ("signs") */
  rules?: string[];

  /** System prompt override (advanced) */
  systemPrompt?: string;

  // === CALLBACKS ===

  /** Called after each iteration */
  onUpdate?: (status: RalphStatus) => void;

  /** Called when stuck is detected - return string to nudge */
  onStuck?: (context: StuckContext) => Promise<string | null>;

  /** Called on completion */
  onComplete?: (result: RalphResult) => void;

  /** Called on error */
  onError?: (error: RalphError) => void;

  // === GIT ===

  git?: {
    /** Auto-commit after each iteration (default: true) */
    commitPerIteration?: boolean;
    /** Commit message template */
    commitTemplate?: string;
    /** Auto-push on completion (default: true) */
    autoPush?: boolean;
    /** Create PR on completion (default: false) */
    createPR?: boolean;
    /** PR title template */
    prTitle?: string;
    /** PR body template */
    prBody?: string;
  };

  // === ADVANCED ===

  /** Custom tools to add to the agent */
  tools?: Tool[];

  /** Disable default tools (filesystem, terminal, browser) */
  disableDefaultTools?: boolean;

  /** Stuck detection configuration */
  stuckDetection?: {
    /** Iterations without progress before stuck (default: 3) */
    threshold?: number;
    /** Disable stuck detection */
    disabled?: boolean;
  };
}
```

#### Methods

```typescript
class LoopAgent {
  /** Start the agent loop */
  run(): Promise<RalphResult>;

  /** Stop the agent gracefully */
  stop(): Promise<void>;

  /** Send a nudge message to the agent */
  nudge(message: string): void;

  /** Get current status */
  getStatus(): RalphStatus;

  /** Get iteration history */
  getHistory(): Iteration[];
}
```

---

### Types

#### RalphStatus

Real-time status of the agent.

```typescript
interface RalphStatus {
  /** Unique run ID */
  id: string;

  /** Current state */
  state:
    | "initializing"
    | "running"
    | "stuck"
    | "completing"
    | "done"
    | "failed"
    | "stopped";

  /** Current iteration number */
  iteration: number;

  /** Total cost so far (USD) */
  cost: number;

  /** Elapsed time */
  elapsed: string;

  /** Last N actions taken */
  lastActions: string[];

  /** Currently active file (if any) */
  currentFile?: string;

  /** Running processes */
  processes: ProcessInfo[];

  /** Open browsers */
  browsers: BrowserInfo[];
}
```

#### RalphResult

Final result after completion.

```typescript
interface RalphResult {
  /** Whether the task completed successfully */
  success: boolean;

  /** Completion reason */
  reason:
    | "completed"
    | "max_iterations"
    | "max_cost"
    | "timeout"
    | "stopped"
    | "error";

  /** Total iterations */
  iterations: number;

  /** Total cost (USD) */
  cost: number;

  /** Total elapsed time */
  elapsed: string;

  /** Summary from DONE.md or completion check */
  summary: string;

  /** Git diff of all changes */
  diff: string;

  /** Branch name */
  branch: string;

  /** PR URL if created */
  prUrl?: string;

  /** Files changed */
  filesChanged: string[];

  /** Error if failed */
  error?: RalphError;
}
```

#### ContextFile

Additional context to pass to the agent.

```typescript
interface ContextFile {
  /** Filename (shown to agent) */
  name: string;
  /** File content */
  content: string;
}
```

#### Iteration

Record of a single iteration.

```typescript
interface Iteration {
  /** Iteration number */
  number: number;

  /** Start timestamp */
  startedAt: Date;

  /** End timestamp */
  endedAt: Date;

  /** Duration in ms */
  duration: number;

  /** Tokens used */
  tokens: { input: number; output: number };

  /** Cost (USD) */
  cost: number;

  /** Actions taken */
  actions: Action[];

  /** Files modified */
  filesModified: string[];

  /** Git commit SHA (if committed) */
  commitSha?: string;
}
```

---

## Tools

Ralph provides managed tools that prevent common agent failures. The AI interacts with these tools, not raw bash.

### exec

Run a command that completes (builds, tests, type checks).

```typescript
const execTool = {
  name: "exec",
  description:
    "Run a command and wait for it to complete. Use for builds, tests, type checks, git commands, file operations.",
  parameters: z.object({
    command: z.string().describe("The command to run"),
    cwd: z.string().optional().describe("Working directory"),
    timeout: z
      .number()
      .optional()
      .describe("Timeout in seconds (default: 300)"),
  }),
  execute: async ({ command, cwd, timeout }) => {
    return {
      exitCode: number,
      stdout: string,
      stderr: string,
      duration: number,
    };
  },
};
```

**Examples the AI might use:**

```
exec({ command: 'pnpm typecheck' })
exec({ command: 'pnpm test', timeout: 120 })
exec({ command: 'git status' })
exec({ command: 'cat src/index.ts' })
```

### startProcess

Start a long-running process (dev servers, watch modes). **Only one process per name can exist.**

```typescript
const startProcessTool = {
  name: "startProcess",
  description:
    "Start a long-running process like a dev server. Only ONE process per name can run - starting a new one auto-kills the old one.",
  parameters: z.object({
    name: z.string().describe('Unique name like "dev-server" or "test-watch"'),
    command: z.string().describe("The command to run"),
    cwd: z.string().optional(),
    readySignal: z
      .string()
      .optional()
      .describe(
        'Text that indicates ready, e.g. "Ready on http://localhost:3000"'
      ),
  }),
  execute: async ({ name, command, cwd, readySignal }) => {
    return {
      processId: string,
      status: "running",
      url: string, // Extracted from output if it's a server
    };
  },
};
```

**Key behaviors:**

- Auto-kills existing process with same name
- Waits for `readySignal` before returning
- Extracts URLs from output
- Runs in background (doesn't block)

### stopProcess

Stop a running process.

```typescript
const stopProcessTool = {
  name: "stopProcess",
  description: "Stop a running process by name",
  parameters: z.object({
    name: z.string(),
  }),
  execute: async ({ name }) => {
    return { stopped: name };
  },
};
```

### getProcessOutput

Get recent output from a process.

```typescript
const getProcessOutputTool = {
  name: "getProcessOutput",
  description: "Get recent output from a running process",
  parameters: z.object({
    name: z.string(),
    lines: z.number().optional().describe("Number of lines (default: 50)"),
  }),
  execute: async ({ name, lines }) => {
    return { output: string };
  },
};
```

### listProcesses

List all running processes.

```typescript
const listProcessesTool = {
  name: "listProcesses",
  description: "List all running processes",
  execute: async () => {
    return {
      processes: Array<{
        name: string;
        command: string;
        uptime: string;
        status: "running" | "exited";
      }>,
    };
  },
};
```

### openBrowser

Open a browser for visual verification.

```typescript
const openBrowserTool = {
  name: 'openBrowser',
  description: 'Open a browser to visually check your work. Use after starting a dev server.',
  parameters: z.object({
    url: z.string(),
    name: z.string().optional().describe('Browser instance name (default: "main")'),
  }),
  execute: async ({ url, name }) => {
    return {
      browserId: string,
      url: string,
      screenshot: string,       // Base64 PNG - AI can see this
      consoleErrors: string[],  // Any JS errors
    }
  }
}
```

### screenshot

Take a screenshot of current browser state.

```typescript
const screenshotTool = {
  name: "screenshot",
  description: "Take a screenshot of the current browser state",
  parameters: z.object({
    name: z.string().optional(),
    selector: z
      .string()
      .optional()
      .describe("CSS selector to screenshot specific element"),
    fullPage: z.boolean().optional(),
  }),
  execute: async ({ name, selector, fullPage }) => {
    return {
      screenshot: string, // Base64 PNG
      viewport: { width: number, height: number },
      url: string,
    };
  },
};
```

### interact

Interact with the browser.

```typescript
const interactTool = {
  name: "interact",
  description: "Interact with the browser - click, type, scroll",
  parameters: z.object({
    action: z.enum(["click", "type", "scroll", "hover"]),
    selector: z.string().optional(),
    value: z
      .string()
      .optional()
      .describe("For type: text to enter. For scroll: pixels."),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
  }),
  execute: async ({ action, selector, value, position }) => {
    return {
      success: boolean,
      screenshot: string, // Screenshot after interaction
    };
  },
};
```

### closeBrowser

Close a browser instance.

```typescript
const closeBrowserTool = {
  name: "closeBrowser",
  description: "Close a browser instance",
  parameters: z.object({
    name: z.string().optional(),
  }),
  execute: async ({ name }) => {
    return { closed: name };
  },
};
```

### writeFile

Write content to a file.

```typescript
const writeFileTool = {
  name: "writeFile",
  description: "Write content to a file. Creates parent directories if needed.",
  parameters: z.object({
    path: z.string(),
    content: z.string(),
  }),
  execute: async ({ path, content }) => {
    return { written: path, bytes: number };
  },
};
```

### readFile

Read a file's content.

```typescript
const readFileTool = {
  name: "readFile",
  description: "Read the contents of a file",
  parameters: z.object({
    path: z.string(),
  }),
  execute: async ({ path }) => {
    return { content: string };
  },
};
```

### listFiles

List files in a directory.

```typescript
const listFilesTool = {
  name: "listFiles",
  description: "List files and directories",
  parameters: z.object({
    path: z.string().optional().describe('Directory path (default: ".")'),
    recursive: z.boolean().optional(),
    pattern: z.string().optional().describe("Glob pattern to filter"),
  }),
  execute: async ({ path, recursive, pattern }) => {
    return {
      files: Array<{
        path: string;
        type: "file" | "directory";
        size?: number;
      }>,
    };
  },
};
```

### done

Signal task completion.

```typescript
const doneTool = {
  name: "done",
  description:
    "Signal that the task is complete. Include a summary of what was done.",
  parameters: z.object({
    summary: z.string().describe("Summary of what was accomplished"),
  }),
  execute: async ({ summary }) => {
    // Writes DONE.md and signals completion
    return { completed: true };
  },
};
```

---

## Process Manager

The ProcessManager handles long-running processes safely.

### Behavior

```typescript
class ProcessManager {
  /** Start a process - auto-kills existing with same name */
  async start(
    name: string,
    command: string,
    opts?: ProcessOpts
  ): Promise<ManagedProcess>;

  /** Kill a process gracefully (SIGTERM, then SIGKILL after 5s) */
  async kill(name: string): Promise<void>;

  /** Kill all processes */
  async killAll(): Promise<void>;

  /** Cleanup idle processes (called after each iteration) */
  async cleanup(): Promise<void>;

  /** Get a process by name */
  get(name: string): ManagedProcess | undefined;

  /** List all processes */
  list(): ProcessInfo[];
}
```

### Auto-Cleanup Rules

After each iteration, the ProcessManager:

1. Kills processes idle for > 5 minutes
2. Kills processes that have exited with errors
3. Keeps servers that are still receiving requests

### Why This Matters

Without managed processes, agents commonly:

- Start `pnpm dev` and hang forever (command never returns)
- Start multiple dev servers (port conflicts)
- Leave zombie processes consuming resources
- Lose track of what's running

The ProcessManager prevents all of these.

---

## Browser Manager

The BrowserManager provides Playwright-based visual verification.

### Behavior

```typescript
class BrowserManager {
  /** Launch a new browser - auto-closes existing with same name */
  async launch(name: string): Promise<Browser>;

  /** Get the page for a browser */
  getPage(name: string): Page | undefined;

  /** Close a browser */
  async close(name: string): Promise<void>;

  /** Close all browsers */
  async closeAll(): Promise<void>;
}
```

### Console Error Capture

All browsers automatically capture console errors:

```typescript
page.on("console", (msg) => {
  if (msg.type() === "error") {
    this.consoleErrors.push(msg.text());
  }
});
```

These are returned with screenshots so the agent can see JS errors.

### Screenshot Returns

Screenshots are returned as base64 PNG strings. The AI model can see these directly in multimodal models, allowing visual verification of UI changes.

---

## Stuck Detection

Ralph detects when he's not making progress and can be nudged.

### Detection Patterns

```typescript
interface StuckDetector {
  /** Check if the agent is stuck */
  isStuck(history: Iteration[]): boolean;

  /** Get context about why stuck */
  getContext(history: Iteration[]): StuckContext;
}
```

### Stuck Conditions

| Condition            | Description                                      |
| -------------------- | ------------------------------------------------ |
| Repetitive actions   | Same files modified 3+ times with no new changes |
| Error loop           | Same error message 3+ times                      |
| Oscillation          | A-B-A-B pattern (undo/redo cycling)              |
| High cost, no output | Lots of tokens spent with no file changes        |
| Empty iterations     | Multiple iterations with no actions              |

### StuckContext

```typescript
interface StuckContext {
  /** Why we think it's stuck */
  reason: "repetitive" | "error_loop" | "oscillation" | "no_progress" | "empty";

  /** Relevant details */
  details: string;

  /** Last N actions */
  recentActions: string[];

  /** Repeated error if applicable */
  repeatedError?: string;

  /** Files being cycled if applicable */
  cycledFiles?: string[];
}
```

### Nudge Mechanism

When stuck is detected, the `onStuck` callback is called. Return a string to inject guidance:

```typescript
const agent = new LoopAgent({
  // ...
  onStuck: async (context) => {
    if (context.reason === "error_loop") {
      return `You're stuck on this error: ${context.repeatedError}. Try a different approach.`;
    }
    return null; // Let Ralph keep trying
  },
});
```

The nudge is injected into the next iteration's prompt.

---

## System Prompt

Ralph uses a structured system prompt that explains the tools and expectations.

### Default System Prompt

```markdown
You are Ralph, an autonomous coding agent. You work in a loop until your task is complete.

## Your Task

{task}

## Rules

{rules}

## Available Tools

### Execution

- `exec`: Run commands that complete (build, test, typecheck)
- `startProcess`: Start long-running processes (dev servers)
- `stopProcess`: Stop a process
- `getProcessOutput`: See process output
- `listProcesses`: List running processes

### Files

- `readFile`: Read file contents
- `writeFile`: Write to files
- `listFiles`: List directory contents

### Browser (Visual Verification)

- `openBrowser`: Open browser and take screenshot
- `screenshot`: Take screenshot of current state
- `interact`: Click, type, scroll
- `closeBrowser`: Close browser

### Completion

- `done`: Signal task complete with summary

## Important Guidelines

1. **Start with exploration**: List files, read key files, understand the codebase
2. **Make incremental changes**: Small commits, verify each step
3. **Use visual verification**: For UI changes, open browser and screenshot
4. **Check your work**: Run typecheck, tests, build before completing
5. **Handle errors**: If something fails, read the error and fix it
6. **Signal completion**: Call `done` with a summary when finished

## Process Management

- Use `startProcess` for dev servers (NOT `exec`)
- Only one process per name - starting kills the old one
- Provide `readySignal` to know when server is ready
- Always clean up processes when done

## Visual Verification

Before completing UI tasks:

1. `startProcess` to run dev server
2. `openBrowser` to see the result
3. Check `consoleErrors` for JS errors
4. `screenshot` to verify appearance
5. `interact` to test functionality

## When You're Done

Call `done({ summary: "What you accomplished" })` to complete the task.
Do NOT just stop - always call `done` or the task will be marked incomplete.
```

### Customization

You can override the system prompt entirely:

```typescript
const agent = new LoopAgent({
  systemPrompt: `Custom prompt here...`,
});
```

Or append to it:

```typescript
const agent = new LoopAgent({
  rules: [
    "Use TypeScript strict mode",
    "Run prettier before committing",
    "Never modify package.json without asking",
  ],
});
```

---

## Sandbox Interface

Ralph is sandbox-agnostic. Implement this interface for any sandbox provider.

```typescript
interface Sandbox {
  /** Initialize the sandbox */
  init(): Promise<void>;

  /** Clone a repository */
  clone(repo: RepoConfig): Promise<void>;

  /** Execute a command */
  exec(command: string, opts?: ExecOpts): Promise<ExecResult>;

  /** Start a background process */
  startProcess(
    name: string,
    command: string,
    opts?: ProcessOpts
  ): Promise<Process>;

  /** Kill a process */
  killProcess(name: string): Promise<void>;

  /** Read a file */
  readFile(path: string): Promise<string>;

  /** Write a file */
  writeFile(path: string, content: string): Promise<void>;

  /** List files */
  listFiles(path: string, opts?: ListOpts): Promise<FileInfo[]>;

  /** Check if file exists */
  exists(path: string): Promise<boolean>;

  /** Get public URL for a port */
  getUrl(port: number): string;

  /** Launch Playwright browser */
  launchBrowser(): Promise<Browser>;

  /** Cleanup and destroy */
  destroy(): Promise<void>;
}
```

### Vercel Sandbox Implementation

```typescript
import { Sandbox as VercelSandboxSDK } from "@vercel/sandbox";

class VercelSandbox implements Sandbox {
  private sdk: VercelSandboxSDK;

  async init() {
    this.sdk = await VercelSandboxSDK.create({
      timeout: ms("4h"),
    });
  }

  async clone(repo: RepoConfig) {
    await this.sdk.runCommand({
      cmd: "git",
      args: ["clone", "--branch", repo.branch, repo.url, "/workspace"],
      env: { GIT_TOKEN: repo.token },
    });
  }

  // ... implement other methods
}
```

### E2B Implementation

```typescript
import { Sandbox as E2BSandboxSDK } from "e2b";

class E2BSandbox implements Sandbox {
  private sdk: E2BSandboxSDK;

  async init() {
    this.sdk = await E2BSandboxSDK.create();
  }

  // ... implement other methods
}
```

---

## Git Operations

Ralph handles git operations for committing and pushing results.

### Per-Iteration Commits

By default, Ralph commits after each iteration:

```bash
git add -A
git commit -m "ralph: iteration {n} - {summary}"
```

This provides checkpoints for recovery and debugging.

### Completion Push

On completion, Ralph:

1. Commits any remaining changes
2. Pushes to the branch
3. Optionally creates a PR

```typescript
const agent = new LoopAgent({
  git: {
    autoPush: true,
    createPR: true,
    prTitle: "Ralph: {task_summary}",
    prBody: `
## Summary
{summary}

## Changes
{diff_summary}

## Iterations
{iteration_count} iterations, ${cost} cost

---
*Automated by Ralph*
    `,
  },
});
```

### Token Security

GitHub tokens are:

1. Injected via environment variable
2. Used only for git operations
3. Never logged or persisted
4. Cleaned up on sandbox destroy

```typescript
const agent = new LoopAgent({
  repo: {
    url: "https://github.com/user/repo",
    branch: "feature",
    token: process.env.GITHUB_TOKEN, // Injected securely
  },
});
```

---

## Events & Callbacks

Ralph provides callbacks for monitoring and intervention.

### onUpdate

Called after each iteration with current status.

```typescript
const agent = new LoopAgent({
  onUpdate: (status) => {
    console.log(
      `Iteration ${status.iteration}: ${status.lastActions.join(", ")}`
    );
    console.log(`Cost: $${status.cost.toFixed(2)}`);

    // Send to dashboard, database, etc.
    dashboard.update(status);
  },
});
```

### onStuck

Called when stuck is detected. Return a nudge or null.

```typescript
const agent = new LoopAgent({
  onStuck: async (context) => {
    // Log for debugging
    console.warn("Ralph is stuck:", context.reason);

    // AI-powered nudge
    const nudge = await askLisa(context);
    return nudge;
  },
});
```

### onComplete

Called on successful completion.

```typescript
const agent = new LoopAgent({
  onComplete: (result) => {
    notify(`Ralph completed: ${result.summary}`);

    if (result.prUrl) {
      notify(`PR created: ${result.prUrl}`);
    }
  },
});
```

### onError

Called on fatal errors.

```typescript
const agent = new LoopAgent({
  onError: (error) => {
    console.error("Ralph failed:", error);
    alertOncall(error);
  },
});
```

---

## Error Handling

### Error Types

```typescript
class RalphError extends Error {
  code: RalphErrorCode;
  iteration?: number;
  recoverable: boolean;
}

type RalphErrorCode =
  | "SANDBOX_INIT_FAILED"
  | "CLONE_FAILED"
  | "ITERATION_FAILED"
  | "MAX_ITERATIONS"
  | "MAX_COST"
  | "TIMEOUT"
  | "STUCK"
  | "PROCESS_FAILED"
  | "BROWSER_FAILED"
  | "GIT_PUSH_FAILED";
```

### Recovery

Some errors are recoverable:

```typescript
try {
  await agent.run();
} catch (error) {
  if (error.recoverable) {
    // Can retry from last checkpoint
    const result = await agent.run({ resumeFrom: error.iteration });
  }
}
```

### Graceful Shutdown

On stop or error, Ralph:

1. Kills all processes
2. Closes all browsers
3. Commits current state (if any changes)
4. Destroys sandbox

```typescript
// Graceful stop
await agent.stop();

// Or force stop
agent.stop({ force: true });
```

---

## Configuration Examples

### Simple Task

```typescript
const agent = new LoopAgent({
  sandbox: new VercelSandbox(),
  model: "claude-sonnet-4-20250514",
  task: "Add a dark mode toggle to the header",
  repo: {
    url: "https://github.com/user/app",
    branch: "feat/dark-mode",
  },
});
```

### With Rules

```typescript
const agent = new LoopAgent({
  sandbox: new VercelSandbox(),
  model: "claude-sonnet-4-20250514",
  task: "Refactor the auth module to use JWT",
  repo: {
    url: "https://github.com/user/app",
    branch: "refactor/jwt-auth",
  },
  rules: [
    "Do not modify the database schema",
    "Keep backward compatibility with existing tokens",
    "Add unit tests for new code",
    "Run pnpm test before completing",
  ],
});
```

### With Context

```typescript
const agent = new LoopAgent({
  sandbox: new VercelSandbox(),
  model: "claude-sonnet-4-20250514",
  task: "Implement the design from the spec",
  repo: {
    url: "https://github.com/user/app",
    branch: "feat/new-dashboard",
  },
  context: [
    {
      name: "design-spec.md",
      content: fs.readFileSync("./specs/dashboard.md", "utf-8"),
    },
    {
      name: "api-schema.json",
      content: fs.readFileSync("./specs/api.json", "utf-8"),
    },
  ],
});
```

### With Custom Completion

```typescript
const agent = new LoopAgent({
  sandbox: new VercelSandbox(),
  model: "claude-sonnet-4-20250514",
  task: "Fix all failing tests",
  repo: {
    url: "https://github.com/user/app",
    branch: "fix/tests",
  },
  completion: {
    type: "command",
    command: "pnpm test", // Complete when tests pass
  },
});
```

### With Monitoring

```typescript
const agent = new LoopAgent({
  sandbox: new VercelSandbox(),
  model: "claude-sonnet-4-20250514",
  task: "Migrate from Webpack to Vite",
  repo: {
    url: "https://github.com/user/app",
    branch: "chore/vite-migration",
  },
  limits: {
    maxIterations: 100,
    maxCost: 20.0,
    timeout: "6h",
  },
  onUpdate: (status) => {
    db.updateRalphRun(runId, status);
    ws.emit("ralph:update", status);
  },
  onStuck: async (context) => {
    const nudge = await askLisaForHelp(context);
    slack.notify(`Ralph needs help: ${context.reason}`);
    return nudge;
  },
  onComplete: (result) => {
    slack.notify(`Ralph finished: ${result.summary}`);
  },
});
```

---

## Best Practices

### Writing Good Tasks

**Bad:**

```
Fix the app
```

**Good:**

```
Fix the TypeScript errors in src/components/. Run `pnpm typecheck` to see the errors. Fix each error while maintaining the existing functionality. Run typecheck again to verify all errors are resolved.
```

### Writing Good Rules

Rules should be:

- Specific and actionable
- Constraints, not instructions
- Things the agent might forget

**Good rules:**

```typescript
rules: [
  "Run pnpm typecheck before marking complete",
  "Do not modify files in /legacy",
  "Use TSL for shaders, not raw GLSL",
  "Keep changes minimal - only fix what is asked",
  "Commit after each logical change",
];
```

### Providing Context

Context should be:

- Relevant to the task
- Not too large (< 50KB total)
- Self-explanatory

**Good context:**

```typescript
context: [
  { name: "coding-standards.md", content: "..." },
  { name: "api-reference.md", content: "..." },
  { name: "current-architecture.md", content: "..." },
];
```

### Setting Limits

Be generous but bounded:

```typescript
limits: {
  maxIterations: 50,   // Most tasks complete in 10-30
  maxCost: 10.00,      // ~$0.20-0.50 per iteration typical
  timeout: '4h',       // Allow for complex tasks
}
```

---

## Package Structure

```
@ralph/core
├── src/
│   ├── index.ts              # Main exports
│   ├── agent.ts              # LoopAgent class
│   ├── loop.ts               # Core loop logic
│   ├── tools/
│   │   ├── index.ts          # Tool exports
│   │   ├── exec.ts           # exec tool
│   │   ├── process.ts        # process tools
│   │   ├── filesystem.ts     # file tools
│   │   ├── browser.ts        # browser tools
│   │   └── done.ts           # completion tool
│   ├── managers/
│   │   ├── process.ts        # ProcessManager
│   │   └── browser.ts        # BrowserManager
│   ├── stuck/
│   │   ├── detector.ts       # StuckDetector
│   │   └── patterns.ts       # Detection patterns
│   ├── git/
│   │   ├── operations.ts     # Git commands
│   │   └── pr.ts             # PR creation
│   ├── sandbox/
│   │   └── interface.ts      # Sandbox interface
│   └── types.ts              # All TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

### Separate Sandbox Packages

```
@ralph/sandbox-vercel    # Vercel Sandbox implementation
@ralph/sandbox-e2b       # E2B implementation
@ralph/sandbox-local     # Local Docker implementation (for testing)
```

---

## Exports

```typescript
// @ralph/core

// Main class
export { LoopAgent } from "./agent";

// Types
export type {
  LoopAgentConfig,
  RalphStatus,
  RalphResult,
  RalphError,
  Iteration,
  ContextFile,
  StuckContext,
  Sandbox,
} from "./types";

// Tools (for custom tool creation)
export { createTool } from "./tools";

// Managers (for advanced usage)
export { ProcessManager } from "./managers/process";
export { BrowserManager } from "./managers/browser";

// Utilities
export { StuckDetector } from "./stuck/detector";
```

---

## Future Considerations

### Parallel Execution

Running multiple tasks in parallel branches:

```typescript
const results = await Promise.all([
  agent.run({ branch: "feat/a", task: "Task A" }),
  agent.run({ branch: "feat/b", task: "Task B" }),
]);
```

### Checkpointing

Save and resume from checkpoints:

```typescript
const checkpoint = await agent.checkpoint();
// Later...
await agent.resume(checkpoint);
```

### Streaming

Real-time token streaming for live output:

```typescript
const agent = new LoopAgent({
  onToken: (token) => process.stdout.write(token),
});
```

### Custom Tools

Adding domain-specific tools:

```typescript
const agent = new LoopAgent({
  tools: [
    createTool({
      name: "deployPreview",
      description: "Deploy a preview of the current branch",
      execute: async () => {
        const url = await vercel.deploy();
        return { url };
      },
    }),
  ],
});
```
