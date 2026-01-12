# Conventions

## Code Style

### TypeScript

- Strict mode enabled
- ES2022 target
- Bundler module resolution
- All types explicitly defined in `types.ts`

### Tool Definitions (AI SDK v6)

Tools use the new AI SDK v6 format:

```typescript
tool({
  description: "...",
  inputSchema: z.object({ ... }),  // NOT 'parameters'
  execute: async ({ arg1, arg2 }) => { ... }
})
```

### Async Patterns

- All tool executes are async
- Managers use async/await throughout
- Dynamic imports for optional dependencies (playwright, bash-tool)

### Error Handling

- Try/catch in tool executes
- Graceful degradation (fallback bash tools if bash-tool unavailable)
- Error loops tracked by StuckDetector

## File Organization

### Exports

- Main exports in `src/index.ts`
- Each module exports its main class/functions
- Types exported from `types.ts`

### Naming

- Classes: PascalCase (`LoopAgent`, `ProcessManager`)
- Functions: camelCase (`createDefaultTools`, `buildSystemPrompt`)
- Types/Interfaces: PascalCase (`LoopStatus`, `ToolCall`)
- Constants: SCREAMING_SNAKE_CASE (`DEFAULT_LIMITS`, `COST_PER_INPUT_TOKEN`)

## Testing (Future)

- Vitest configured
- Tests should go in `tests/` directory
- Mock managers for unit tests

## Documentation

- JSDoc comments on public APIs
- README.md for user documentation
- .brain/ for internal knowledge
