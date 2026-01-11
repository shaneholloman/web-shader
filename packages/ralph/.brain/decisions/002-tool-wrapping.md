# Decision: Done Tool Wrapping

## Context

Need to detect when the agent calls the `done` tool to signal completion.

## Decision

Wrap the `done` tool's execute function in `runLoop()` to intercept calls:

```typescript
if (name === "done") {
  wrappedTools[name] = {
    ...toolDef,
    execute: async (args, execOptions) => {
      doneSignaled = true;
      state.summary = args.summary;
      // Call original execute
      return toolDef.execute?.(args, execOptions);
    },
  };
}
```

## Alternatives Considered

1. **Custom tool registry** - More complex, unnecessary
2. **Post-execution check** - Can't reliably detect done in tool results
3. **Callback in utility tools** - Couples tools to loop state

## Consequences

### Positive
- Simple implementation
- Works with both default and custom done tools
- No coupling between tools and loop state

### Negative
- Wrapping adds slight overhead
- Type casting needed due to Tool interface
