/**
 * 68-mcp-docs-page: Create MCP Server documentation page and add nav link
 */

import "dotenv/config";
import { LoopAgent, brainRule, trackProgressRule, minimalChangesRule, completionRule, visualCheckRule, processManagementRule } from "@ralph/agent-loop";

// Configuration from environment
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
const AGENT_MODEL = "google/gemini-2.5-flash";
const PROJECT_ROOT = process.env.PROJECT_ROOT || "../..";

if (!AI_GATEWAY_API_KEY) {
  console.error("❌ Missing AI_GATEWAY_API_KEY");
  process.exit(1);
}

const DEBUG = process.env.DEBUG === "true" || process.argv.includes("--debug");

const TASK = `
# Task: Create MCP Server Documentation Page

## Working Directory & Navigation
This script is running from: ${process.cwd()}
Project root is: ${PROJECT_ROOT}

### Repository Structure
\`\`\`
ralph-gpu/                    (project root)
├── apps/
│   └── docs/                 (← TARGET: Next.js docs app)
│       ├── app/
│       │   ├── api/mcp/      (already created - MCP route)
│       │   ├── mcp-server/   (← CREATE: new page here)
│       │   └── ...other pages
│       └── components/
│           └── Navigation.tsx (← MODIFY: add nav link)
└── ralphs/
    └── 68-mcp-docs-page/     (← YOU ARE HERE)
\`\`\`

### Navigation Instructions
- To access docs app: \`cd ${PROJECT_ROOT}/apps/docs\`
- To update progress: use paths relative to ${process.cwd()}

## ⚠️ CRITICAL: CHECK EXISTING PROGRESS FIRST ⚠️
**BEFORE doing ANY work, you MUST:**
1. Check if .progress.md exists: \`cat ${process.cwd()}/.progress.md 2>/dev/null || echo "No progress file"\`
2. Check if mcp-server page exists: \`ls ${PROJECT_ROOT}/apps/docs/app/mcp-server 2>/dev/null || echo "No mcp-server page"\`

**If progress exists, CONTINUE from where you left off. DO NOT restart from scratch!**

## Context
We need to create a documentation page for the MCP server at \`/mcp-server\`. The page should:
- Explain what MCP is and what the server does
- Provide a one-click "Add to Cursor" deeplink button
- Document all 5 available tools
- Show manual setup instructions

## Acceptance Criteria (ALL MUST BE MET)

### 1. MCP Server Page Created
- [ ] Create folder: \`apps/docs/app/mcp-server/\`
- [ ] Create file: \`apps/docs/app/mcp-server/page.tsx\`
- [ ] Page has hero section with "Add to Cursor" deeplink button
- [ ] Page documents all 5 MCP tools with descriptions
- [ ] Page shows manual setup instructions with code blocks
- [ ] Uses existing design system (gray colors, same card styles as other pages)

### 2. Navigation Updated
- [ ] Add "MCP Server" link to Navigation.tsx
- [ ] Place it in the "Reference" section (after "Profiler & Debug")

### 3. Build and Visual Verification
- [ ] Run \`pnpm build --filter docs\` - must pass
- [ ] Start dev server on port 3001 (if not running): \`pnpm dev\`
- [ ] Navigate to http://localhost:3001/mcp-server in browser
- [ ] Take screenshot to verify page renders correctly
- [ ] Check console for errors

## Implementation Guide

### Step 1: Create MCP Server Page

Create \`apps/docs/app/mcp-server/page.tsx\`:

\`\`\`tsx
import { CodeBlock } from '@/components/mdx/CodeBlock';

// Generate the Cursor deeplink URL
const MCP_CONFIG = {
  url: "https://ralph-gpu.labs.vercel.dev/api/mcp/mcp"
};
const CONFIG_BASE64 = Buffer.from(JSON.stringify(MCP_CONFIG)).toString('base64');
const CURSOR_DEEPLINK = \`cursor://anysphere.cursor-deeplink/mcp/install?name=ralph-gpu-docs&config=\${CONFIG_BASE64}\`;

const manualConfigCode = \`{
  "mcpServers": {
    "ralph-gpu-docs": {
      "url": "https://ralph-gpu.labs.vercel.dev/api/mcp/mcp"
    }
  }
}\`;

const localConfigCode = \`{
  "mcpServers": {
    "ralph-gpu-docs": {
      "url": "http://localhost:3001/api/mcp/mcp"
    }
  }
}\`;

export default function McpServerPage() {
  return (
    <div className="px-4 py-8 lg:px-8 lg:py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-12 mb-4">
        MCP Server
      </h1>
      <p className="text-xl text-gray-10 mb-8">
        Connect your AI assistant to ralph-gpu documentation using the Model Context Protocol.
      </p>

      {/* Hero: Add to Cursor Button */}
      <section className="mb-12">
        <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <h2 className="text-xl font-semibold text-gray-12 mb-3">
            One-Click Setup for Cursor
          </h2>
          <p className="text-gray-11 mb-4">
            Add the ralph-gpu MCP server to Cursor instantly. Your AI assistant will gain access to all documentation, examples, and API references.
          </p>
          <a
            href={CURSOR_DEEPLINK}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Add to Cursor
          </a>
        </div>
      </section>

      {/* What is MCP */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-12 mb-4">
          What is MCP?
        </h2>
        <p className="text-gray-11 mb-4">
          The Model Context Protocol (MCP) is an open standard that allows AI assistants to access external tools and data sources. With the ralph-gpu MCP server, your AI can:
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <h3 className="font-semibold text-gray-12 mb-2">Access Documentation</h3>
            <p className="text-gray-9 text-sm">Get complete API reference, concepts, and getting started guides.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <h3 className="font-semibold text-gray-12 mb-2">Browse Examples</h3>
            <p className="text-gray-9 text-sm">List and retrieve full code for all shader examples.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <h3 className="font-semibold text-gray-12 mb-2">Search Content</h3>
            <p className="text-gray-9 text-sm">Find specific topics across all documentation.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <h3 className="font-semibold text-gray-12 mb-2">Quick Start Guide</h3>
            <p className="text-gray-9 text-sm">Get a comprehensive guide with all patterns and best practices.</p>
          </div>
        </div>
      </section>

      {/* Available Tools */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-12 mb-4">
          Available Tools
        </h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <code className="text-blue-400 font-mono text-sm">get_started</code>
            <p className="text-gray-9 text-sm mt-1">
              Returns the comprehensive quickstart guide (~1600 lines) with all patterns, code examples, and best practices. <strong className="text-gray-11">Recommended first call.</strong>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <code className="text-blue-400 font-mono text-sm">get_documentation</code>
            <span className="text-gray-10 text-sm ml-2">topic: "getting-started" | "concepts" | "api"</span>
            <p className="text-gray-9 text-sm mt-1">Get full documentation for a specific topic.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <code className="text-blue-400 font-mono text-sm">list_examples</code>
            <p className="text-gray-9 text-sm mt-1">List all available examples with slug, title, and description.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <code className="text-blue-400 font-mono text-sm">get_example</code>
            <span className="text-gray-10 text-sm ml-2">slug: string</span>
            <p className="text-gray-9 text-sm mt-1">Get full code and shader for a specific example.</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-1 border border-gray-4">
            <code className="text-blue-400 font-mono text-sm">search_docs</code>
            <span className="text-gray-10 text-sm ml-2">query: string</span>
            <p className="text-gray-9 text-sm mt-1">Search documentation for relevant sections by keyword.</p>
          </div>
        </div>
      </section>

      {/* Manual Setup */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-12 mb-4">
          Manual Setup
        </h2>
        <p className="text-gray-11 mb-4">
          If you prefer manual configuration, add the following to your <code className="bg-gray-2 px-1.5 py-0.5 rounded text-sm">.cursor/mcp.json</code> file:
        </p>
        <CodeBlock code={manualConfigCode} language="json" filename=".cursor/mcp.json" />
        
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-400 text-sm font-medium mb-2">Local Development</p>
          <p className="text-gray-11 text-sm mb-3">For local development, use the local URL instead:</p>
          <CodeBlock code={localConfigCode} language="json" />
        </div>
      </section>

      {/* How it Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-12 mb-4">
          How It Works
        </h2>
        <p className="text-gray-11 mb-4">
          When you ask your AI assistant about ralph-gpu, it can now call the MCP server to fetch relevant information:
        </p>
        <div className="p-4 rounded-lg bg-gray-1 border border-gray-4 font-mono text-sm space-y-2">
          <div className="text-gray-10">You: "Create a particle system with ralph-gpu"</div>
          <div className="text-gray-9">AI: <span className="text-blue-400">[calls get_started]</span></div>
          <div className="text-gray-9">AI: <span className="text-blue-400">[receives comprehensive guide]</span></div>
          <div className="text-gray-10">AI: "Here's how to create a particle system with ralph-gpu..."</div>
        </div>
      </section>

      {/* Next Steps */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-12 mb-4">Next Steps</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="/getting-started" className="p-4 rounded-lg bg-gray-1 border border-gray-4 hover:border-gray-5 transition-colors block">
            <h3 className="font-semibold text-gray-12 mb-2">Getting Started →</h3>
            <p className="text-gray-9 text-sm">Learn the basics of ralph-gpu.</p>
          </a>
          <a href="/examples" className="p-4 rounded-lg bg-gray-1 border border-gray-4 hover:border-gray-5 transition-colors block">
            <h3 className="font-semibold text-gray-12 mb-2">Examples →</h3>
            <p className="text-gray-9 text-sm">See ralph-gpu in action.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
\`\`\`

### Step 2: Update Navigation

In \`apps/docs/components/Navigation.tsx\`, find the navItems array and add a new item to the "Reference" section:

\`\`\`typescript
const navItems = [
  { 
    label: 'Documentation',
    items: [
      { href: '/', label: 'Introduction' },
      { href: '/getting-started', label: 'Getting Started' },
      { href: '/concepts', label: 'Core Concepts' },
    ]
  },
  {
    label: 'Reference',
    items: [
      { href: '/api', label: 'API Reference' },
      { href: '/profiler', label: 'Profiler & Debug' },
      { href: '/examples', label: 'Examples' },
      { href: '/mcp-server', label: 'MCP Server' },  // ADD THIS LINE
    ]
  }
];
\`\`\`

### Step 3: Verify Build and Visual Check
\`\`\`bash
cd ${PROJECT_ROOT}
pnpm build --filter docs
\`\`\`

Then start dev server and verify visually:
\`\`\`bash
cd ${PROJECT_ROOT}/apps/docs
pnpm dev
\`\`\`

Navigate to http://localhost:3001/mcp-server and take a screenshot.

## Browser Validation (REQUIRED)
- [ ] Check if dev server is already running with listProcesses (reuse if running)
- [ ] Start dev server: \`pnpm dev\` in apps/docs
- [ ] Navigate to http://localhost:3001/mcp-server in headless browser
- [ ] Take screenshot to verify page renders
- [ ] Check browser console for errors
- [ ] If screenshot shows UI working with no errors → DONE

## Recovery Rules
- Do NOT delete node_modules or pnpm-lock.yaml
- If build fails, READ the error message and fix the actual issue
- If stuck on a build error after 2 attempts, call done() with failure summary

## Completion Criteria
When ALL acceptance criteria are met:
1. Update .progress.md to mark all items [x] complete
2. Call done({ summary: "..." }) IMMEDIATELY
3. Do NOT re-read files or take more screenshots after this

## 🚨 FIRST ACTION - ALWAYS DO THIS FIRST 🚨
Your VERY FIRST action must be to check existing progress and what already exists.
Based on what already exists, SKIP completed tasks and proceed to the next incomplete one.
`;

// Verification function
async function checkMcpPage(): Promise<boolean> {
  const fs = await import("fs/promises");
  const path = await import("path");
  
  const docsPath = path.join(process.cwd(), PROJECT_ROOT, "apps/docs");
  
  try {
    // Check page exists
    const pagePath = path.join(docsPath, "app/mcp-server/page.tsx");
    await fs.access(pagePath);
    console.log("✅ MCP Server page exists");
    
    // Check navigation has the link
    const navPath = path.join(docsPath, "components/Navigation.tsx");
    const navContent = await fs.readFile(navPath, "utf-8");
    if (navContent.includes("/mcp-server")) {
      console.log("✅ Navigation has MCP Server link");
      return true;
    } else {
      console.log("❌ Navigation missing MCP Server link");
      return false;
    }
  } catch (error) {
    console.log("❌ Some files missing:", error);
    return false;
  }
}

async function main() {
  const startTime = Date.now();

  const agent = new LoopAgent({
    model: AGENT_MODEL,
    trace: true,
    task: TASK,
    rules: [brainRule, trackProgressRule, minimalChangesRule, completionRule, visualCheckRule, processManagementRule],
    debug: DEBUG,
    limits: {
      maxIterations: 15,
      maxCost: 5.0,
      timeout: "20m",
    },
    onUpdate: (status) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `[${elapsed}s] Iteration ${status.iteration} | State: ${status.state} | Cost: $${status.cost.toFixed(4)}`
      );
    },
    onStuck: async (ctx) => {
      console.log(`\n⚠️ Agent stuck: ${ctx.reason}`);
      return "Try a different approach. Update .progress.md with what you tried.";
    },
    onError: (error) => {
      console.error(`\n❌ Error: ${error.message}`);
    },
  });

  console.log("🚀 Starting MCP Docs Page agent...\n");

  const result = await agent.run();

  console.log("\n📊 Results");
  console.log(`✅ Success: ${result.success}`);
  console.log(`🔄 Iterations: ${result.iterations}`);
  console.log(`💰 Cost: $${result.cost.toFixed(4)}`);
  console.log(`⏱️ Duration: ${(result.elapsed / 1000).toFixed(1)}s`);

  // Run verification
  const passed = await checkMcpPage();
  console.log(`\n${passed ? "🎉 All checks passed!" : "⚠️ Some checks failed"}`);

  if (!result.success) {
    console.error(`\n❌ Agent failed: ${result.reason}`);
    process.exit(1);
  }

  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
