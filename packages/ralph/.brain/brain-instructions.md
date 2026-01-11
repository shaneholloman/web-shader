# How to Use This .brain Folder

Instructions for AI agents working on this codebase.

---

## Quick Start

Before making changes, read `.brain/index.md` to understand the project structure and conventions. Update `.brain/progress.md` after completing significant work.

---

## Full Workflow

### Before Starting

1. Read `.brain/index.md` for an overview
2. Read `.brain/progress.md` to see what's done and what's next
3. Read `.brain/architecture.md` if you need to understand the codebase
4. Check `.brain/decisions/` for context on past choices

### While Working

- Follow patterns in `.brain/conventions.md`
- If you make a significant architectural decision, add it to `.brain/decisions/`

### After Completing Work

- Update `.brain/progress.md` with what you accomplished
- Add any new knowledge to the appropriate file

---

## File Reference

| File              | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| `index.md`        | Overview and quick reference                    |
| `architecture.md` | High-level design, component diagram, data flow |
| `conventions.md`  | Code style, TypeScript patterns, naming         |
| `progress.md`     | What's done, in progress, and next              |
| `decisions/`      | Architectural decisions with context            |

---

## For System Prompts

Copy this into your system prompt or task description:

```
This project uses a .brain/ folder for persistent knowledge.

Before working:
- Read .brain/index.md for overview
- Read .brain/progress.md for current status

After working:
- Update .brain/progress.md with completed work
- Document any new architectural decisions in .brain/decisions/
```
