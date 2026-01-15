---
name: Interactive Examples Gallery
overview: Transform the ralph-gpu examples app into an interactive Shadertoy-like playground with a gallery of pre-rendered examples and a Monaco-powered code editor.
todos:
  - id: setup-monaco
    content: Install @monaco-editor/react and create MonacoEditor wrapper component
    status: completed
  - id: example-registry
    content: Create examples registry with metadata (title, description, code) for each example
    status: completed
  - id: gallery-page
    content: Redesign gallery page with thumbnail grid layout
    status: completed
  - id: playground-page
    content: Create playground page with split layout (editor + preview)
    status: completed
  - id: preview-component
    content: Build Preview component that compiles and runs shader code
    status: completed
  - id: file-tabs
    content: Implement file tabs UI for switching between files
    status: pending
  - id: run-logic
    content: Implement Run button and Cmd+Enter keyboard shortcut
    status: completed
  - id: thumbnail-script
    content: Create Playwright script to generate example thumbnails
    status: completed
  - id: styling
    content: Style the playground with dark theme matching Shadertoy aesthetic
    status: completed
---

# Interactive Examples Gallery

## Design Decisions

| Question         | Decision                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| Code editor      | **Monaco Editor** - Full VS Code experience with TypeScript IntelliSense |
| Preview behavior | **Manual run** - User clicks "Run" button or presses Cmd/Ctrl+Enter      |

## Architecture Overview

```mermaid
flowchart LR
    subgraph gallery [Gallery Page]
        Grid[Example Cards with Thumbnails]
    end

    subgraph playground [Playground Page]
        Editor[Monaco Editor]
        Preview[WebGPU Canvas]
        Files[File Tabs]
        RunBtn[Run Button]
    end

    Grid -->|click| playground
    Editor -->|Cmd+Enter or Run| Preview
    Files -->|switch| Editor
```

## Completed Work

### 1. Monaco Editor Setup (Ralph 56)

- Installed @monaco-editor/react package
- Created MonacoEditor.tsx wrapper with Cmd+Enter support

### 2. Examples Registry (Ralph 57)

- Created lib/examples.ts with ExampleMeta interface
- Extracted shader code from all 18 examples
- Helper functions: getExampleBySlug, getExamplesByCategory, getAllCategories

### 3. Gallery Page (Ralph 58)

- Redesigned with dark theme and category sections
- ExampleCard component with hover effects
- Links to /playground/[slug]

### 4. Playground Page (Ralph 59)

- Split layout: Monaco editor (left) + WebGPU preview (right)
- Preview component that compiles WGSL shaders
- Run button and error display
- Dark theme styling

### 5. Thumbnail Script (Manual)

- Created scripts/generate-thumbnails.ts
- Uses Playwright to capture screenshots
- Added generate:thumbnails npm script

## Remaining Work

### File Tabs (Pending)

The original request wanted multiple files (HTML and index.ts). Current implementation only edits shader code. This is a lower priority enhancement.

## Files Modified/Created

- apps/examples/components/MonacoEditor.tsx
- apps/examples/components/Preview.tsx
- apps/examples/components/ExampleCard.tsx
- apps/examples/lib/examples.ts
- apps/examples/app/page.tsx (gallery)
- apps/examples/app/playground/[slug]/page.tsx
- apps/examples/app/test-monaco/page.tsx
- apps/examples/scripts/generate-thumbnails.ts
- apps/examples/public/thumbnails/ (directory)
