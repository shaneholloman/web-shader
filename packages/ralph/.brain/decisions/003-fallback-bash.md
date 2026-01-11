# Decision: Fallback Bash Implementation

## Context

`bash-tool` package provides bash/readFile/writeFile tools but requires a sandbox environment. In local development or when bash-tool fails to initialize, we need alternatives.

## Decision

Provide fallback implementations in `tools/bash.ts`:

```typescript
export async function createBashTools() {
  try {
    const bashTool = await import("bash-tool");
    const { tools } = await bashTool.createBashTool();
    return tools;
  } catch {
    return createFallbackBashTools();
  }
}
```

Fallback uses:

- `child_process.exec` for bash commands
- `fs/promises` for file operations

## Alternatives Considered

1. **Require bash-tool always** - Limits flexibility
2. **No bash tools without bash-tool** - Poor DX
3. **Separate package for fallbacks** - Unnecessary complexity

## Consequences

### Positive

- Works in any Node.js environment
- Graceful degradation
- Same tool interface

### Negative

- Fallback lacks bash-tool's sandbox features
- Two code paths to maintain
- Less secure in production (no sandboxing)
