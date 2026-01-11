# Decision: AI SDK v6

## Context

The original spec referenced AI SDK v4 APIs (`parameters`, `maxSteps`, `promptTokens`).

## Decision

Use AI SDK v6 because:
1. `bash-tool` requires `ai@^6.0.0` as a peer dependency
2. v6 is the latest stable version
3. Better to stay current than lock to an older version

## Consequences

### Positive
- Compatible with bash-tool
- Access to latest features
- Future-proof

### Negative
- API differences from spec required adaptation
- Documentation needed updating

## Migration Notes

| v4 API | v6 API |
|--------|--------|
| `parameters` | `inputSchema` |
| `maxSteps: n` | `stopWhen: stepCountIs(n)` |
| `usage.promptTokens` | `usage.inputTokens` |
| `usage.completionTokens` | `usage.outputTokens` |
