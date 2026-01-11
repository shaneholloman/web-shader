import { tool, type Tool } from "ai";
import { z } from "zod";

/**
 * Signal for done tool to communicate completion.
 */
export type DoneSignal = {
  type: "done";
  summary: string;
};

/**
 * Create utility tools.
 * These include the done tool (completion) and think tool (chain-of-thought).
 */
export function createUtilityTools(onDone: (summary: string) => void): Record<string, Tool> {
  return {
    done: tool({
      description:
        "Signal that the task is complete. Call this when you have finished the task. Provide a summary of what was accomplished.",
      inputSchema: z.object({
        summary: z
          .string()
          .describe(
            "Summary of what was accomplished. Be specific about changes made."
          ),
      }),
      execute: async ({ summary }) => {
        onDone(summary);
        return { completed: true };
      },
    }),

    think: tool({
      description:
        "Think through a problem before acting. Use this for complex decisions, planning, or when you need to reason step by step. The thought is logged but has no side effects.",
      inputSchema: z.object({
        thought: z
          .string()
          .describe(
            "Your reasoning or thought process. Break down the problem, consider options, plan next steps."
          ),
      }),
      execute: async ({ thought }) => {
        // Just returns the thought, no side effects
        return { thought };
      },
    }),
  };
}

export const utilityTools = {
  create: createUtilityTools,
};
