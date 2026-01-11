import { tool, type Tool } from "ai";
import { z } from "zod";
import { ProcessManager } from "../managers/process";

/**
 * Create process management tools.
 * These handle long-running processes like dev servers.
 */
export function createProcessTools(manager: ProcessManager): Record<string, Tool> {
  return {
    startProcess: tool({
      description:
        "Start a long-running process. Only ONE per name - starting a new one with the same name kills the old one. Use for dev servers, watch modes, etc.",
      inputSchema: z.object({
        name: z
          .string()
          .describe('Unique name for the process, e.g., "dev", "test-watch"'),
        command: z.string().describe("Command to run"),
        cwd: z.string().optional().describe("Working directory"),
        readyPattern: z
          .string()
          .optional()
          .describe(
            'Regex pattern that indicates the process is ready, e.g., "Ready on", "listening on"'
          ),
      }),
      execute: async ({ name, command, cwd, readyPattern }) => {
        const info = await manager.start({ name, command, cwd, readyPattern });
        return {
          name: info.name,
          pid: info.pid,
          status: "running",
        };
      },
    }),

    stopProcess: tool({
      description: "Stop a running process by name",
      inputSchema: z.object({
        name: z.string().describe("Name of the process to stop"),
      }),
      execute: async ({ name }) => {
        const stopped = await manager.stop(name);
        return {
          name,
          stopped,
        };
      },
    }),

    listProcesses: tool({
      description: "List all running managed processes",
      inputSchema: z.object({}),
      execute: async () => {
        const processes = manager.list();
        return {
          processes: processes.map((p) => ({
            name: p.name,
            command: p.command,
            pid: p.pid,
            uptime: p.uptime,
          })),
        };
      },
    }),

    getProcessOutput: tool({
      description: "Get recent output from a running process",
      inputSchema: z.object({
        name: z.string().describe("Name of the process"),
        lines: z
          .number()
          .optional()
          .describe("Number of lines to return (default: 100)"),
      }),
      execute: async ({ name, lines }) => {
        const output = manager.getOutput(name, lines);
        if (!output) {
          return {
            error: `Process "${name}" not found`,
          };
        }
        return output;
      },
    }),
  };
}

export const processTools = {
  create: createProcessTools,
};
