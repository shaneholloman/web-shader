import { tool, type Tool } from "ai";
import { z } from "zod";

/**
 * Create bash tools using the bash-tool package.
 * Returns bash, readFile, and writeFile tools.
 */
export async function createBashTools(): Promise<Record<string, Tool>> {
  try {
    const bashTool = await import("bash-tool");
    const { tools } = await bashTool.createBashTool();
    return tools;
  } catch {
    // Fall back to built-in implementation
    return createFallbackBashTools();
  }
}

/**
 * Get bash tools - async factory function.
 * This is the primary way to get bash tools.
 */
export const bashTools = {
  create: createBashTools,
};

/**
 * Fallback bash tool implementation if bash-tool is not available.
 * Uses child_process directly.
 */
export function createFallbackBashTools(): Record<string, Tool> {
  return {
    bash: tool({
      description: "Execute bash commands in the sandbox environment",
      inputSchema: z.object({
        command: z.string().describe("Bash command to execute"),
      }),
      execute: async ({ command }) => {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        try {
          const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB
            timeout: 60000, // 1 minute
          });
          return { stdout, stderr, exitCode: 0 };
        } catch (error: unknown) {
          const execError = error as {
            stdout?: string;
            stderr?: string;
            code?: number;
          };
          return {
            stdout: execError.stdout ?? "",
            stderr: execError.stderr ?? (error as Error).message,
            exitCode: execError.code ?? 1,
          };
        }
      },
    }),

    readFile: tool({
      description: "Read the contents of a file",
      inputSchema: z.object({
        path: z.string().describe("Path to the file"),
      }),
      execute: async ({ path }) => {
        const fs = await import("fs/promises");
        try {
          const content = await fs.readFile(path, "utf-8");
          return content;
        } catch (error) {
          throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
      },
    }),

    writeFile: tool({
      description:
        "Write content to a file. Creates parent directories if needed.",
      inputSchema: z.object({
        path: z.string().describe("Path to the file"),
        content: z.string().describe("Content to write"),
      }),
      execute: async ({ path, content }) => {
        const fs = await import("fs/promises");
        const pathModule = await import("path");

        try {
          // Create parent directories
          const dir = pathModule.dirname(path);
          await fs.mkdir(dir, { recursive: true });

          await fs.writeFile(path, content, "utf-8");
          return { success: true };
        } catch (error) {
          throw new Error(`Failed to write file: ${(error as Error).message}`);
        }
      },
    }),
  };
}
