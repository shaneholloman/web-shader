import type { ContextFile } from "./types";

/**
 * Options for building the system prompt.
 */
export interface PromptBuilderOptions {
  task: string;
  rules?: string[];
  context?: string | ContextFile[];
  customSystemPrompt?: string;
}

/**
 * Default base system prompt.
 */
const DEFAULT_BASE_PROMPT = `You are an autonomous coding agent. You work in a loop until your task is complete.

## How You Work

1. You receive a task and execute it step by step
2. Use the available tools to read files, run commands, make changes
3. Call the \`done\` tool when the task is complete

## Guidelines

- Be methodical and thorough
- Read code before modifying it
- Test your changes when possible
- If stuck, try a different approach
- Use \`think\` to reason through complex problems`;

/**
 * Build the system prompt from configuration.
 */
export function buildSystemPrompt(options: PromptBuilderOptions): string {
  const { task, rules, context, customSystemPrompt } = options;

  // If custom system prompt provided, use it directly
  if (customSystemPrompt) {
    return customSystemPrompt;
  }

  const parts: string[] = [DEFAULT_BASE_PROMPT];

  // Add task
  parts.push(`\n## Your Task\n\n${task}`);

  // Add rules
  if (rules && rules.length > 0) {
    parts.push(`\n## Rules\n\n${rules.join("\n\n")}`);
  }

  // Add context
  if (context) {
    if (typeof context === "string") {
      parts.push(`\n## Context\n\n${context}`);
    } else if (Array.isArray(context) && context.length > 0) {
      const contextParts = context.map(
        (file) => `### ${file.name}\n\n\`\`\`\n${file.content}\n\`\`\``
      );
      parts.push(`\n## Context Files\n\n${contextParts.join("\n\n")}`);
    }
  }

  // Add important reminders
  parts.push(`
## Important

- Use \`bash\` for most filesystem and command operations
- Use \`startProcess\` for long-running processes (dev servers, watch modes)
- Call \`done\` with a summary when finished
- If something isn't working, try a different approach
- Use \`think\` to reason through complex decisions`);

  return parts.join("\n");
}

/**
 * Build a nudge message to inject into the conversation.
 */
export function buildNudgeMessage(message: string): string {
  return `[System Nudge]: ${message}`;
}

/**
 * Format iteration context for the model.
 * This helps the model understand where it is in the task.
 */
export function formatIterationContext(
  iteration: number,
  maxIterations: number,
  cost: number,
  maxCost: number
): string {
  return `[Iteration ${iteration + 1}/${maxIterations}, Cost: $${cost.toFixed(2)}/$${maxCost.toFixed(2)}]`;
}
