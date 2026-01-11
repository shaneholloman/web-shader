/**
 * 01-init: Test the @ralph/core library by generating a repository context file
 *
 * This script uses the LoopAgent to explore the repository and create
 * a comprehensive context document about its structure and purpose.
 */

import "dotenv/config";
import { LoopAgent, explorationRule, brainRule } from "@ralph/core";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Get configuration from environment
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
const AI_GATEWAY_BASE_URL = process.env.AI_GATEWAY_BASE_URL;
const AGENT_MODEL = process.env.AGENT_MODEL || "anthropic/claude-sonnet-4-20250514";
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

if (!AI_GATEWAY_API_KEY) {
  console.error("❌ Missing AI_GATEWAY_API_KEY in environment");
  process.exit(1);
}

if (!AI_GATEWAY_BASE_URL) {
  console.error("❌ Missing AI_GATEWAY_BASE_URL in environment");
  console.error("   Example: https://api.openai.com/v1 or your custom gateway URL");
  process.exit(1);
}

// Create the AI gateway provider
const gateway = createOpenAICompatible({
  name: "ai-gateway",
  baseURL: AI_GATEWAY_BASE_URL,
  apiKey: AI_GATEWAY_API_KEY,
});

console.log("🤖 Ralph Agent - Repository Context Generator");
console.log("━".repeat(50));
console.log(`📁 Project: ${PROJECT_ROOT}`);
console.log(`🌐 Gateway: ${AI_GATEWAY_BASE_URL}`);
console.log(`🧠 Model: ${AGENT_MODEL}`);
console.log("━".repeat(50));

const TASK = `
You are tasked with exploring this repository and creating a comprehensive context file.

## Goal

Create a file called "REPO_CONTEXT.md" in the root of the project that documents:

1. **Project Overview**: What is this project about? What problem does it solve?
2. **Tech Stack**: What technologies, frameworks, and tools are used?
3. **Project Structure**: Describe the directory layout and main components
4. **Packages/Workspaces**: List all packages in the monorepo (if applicable)
5. **Key Files**: Identify and briefly describe the most important files
6. **Development Setup**: How to install and run the project

## Instructions

1. Start by exploring the root directory to understand the project structure
2. Read key files like package.json, README.md, tsconfig.json, etc.
3. Explore the main source directories
4. Create a well-organized markdown document summarizing your findings
5. Write the document to REPO_CONTEXT.md

Be thorough but concise. Focus on information that would help a new developer understand the codebase quickly.

When you're done, call the done() tool with a summary of what you created.
`;

async function main() {
  const startTime = Date.now();

  const agent = new LoopAgent({
    model: gateway(AGENT_MODEL),
    task: TASK,
    rules: [explorationRule, brainRule],
    limits: {
      maxIterations: 30,
      maxCost: 2.0,
      timeout: "10m",
    },
    onUpdate: (status) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `[${elapsed}s] Iteration ${status.iteration} | State: ${status.state} | Cost: $${status.cost.toFixed(4)}`
      );
      if (status.lastActions.length > 0) {
        console.log(`  → Actions: ${status.lastActions.slice(-3).join(", ")}`);
      }
    },
    onStuck: async (ctx) => {
      console.log(`\n⚠️ Agent stuck: ${ctx.reason}`);
      return "Try a different approach. If you're having trouble reading files, try listing the directory first.";
    },
    onError: (error) => {
      console.error(`\n❌ Error: ${error.message}`);
    },
  });

  console.log("\n🚀 Starting agent...\n");

  const result = await agent.run();

  console.log("\n" + "━".repeat(50));
  console.log("📊 Results");
  console.log("━".repeat(50));
  console.log(`✅ Success: ${result.success}`);
  console.log(`📝 Reason: ${result.reason}`);
  console.log(`🔄 Iterations: ${result.iterations}`);
  console.log(`💰 Cost: $${result.cost.toFixed(4)}`);
  console.log(`⏱️ Duration: ${(result.elapsed / 1000).toFixed(1)}s`);
  console.log(
    `🔤 Tokens: ${result.tokens.total.toLocaleString()} (in: ${result.tokens.input.toLocaleString()}, out: ${result.tokens.output.toLocaleString()})`
  );
  console.log("━".repeat(50));

  if (result.summary) {
    console.log("\n📄 Summary:");
    console.log(result.summary);
  }

  if (!result.success) {
    console.error(`\n❌ Agent failed: ${result.reason}`);
    if (result.error) {
      console.error(`Error details: ${result.error.message}`);
    }
    process.exit(1);
  }

  console.log("\n✨ Done!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
