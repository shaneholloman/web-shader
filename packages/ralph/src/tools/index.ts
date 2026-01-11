import type { Tool } from "ai";
import { ProcessManager } from "../managers/process";
import { BrowserManager } from "../managers/browser";
import { createBashTools, createFallbackBashTools } from "./bash";
import { createProcessTools } from "./process";
import { createBrowserTools } from "./browser";
import { createUtilityTools } from "./utility";

export { bashTools, createBashTools, createFallbackBashTools } from "./bash";
export { processTools, createProcessTools } from "./process";
export { browserTools, createBrowserTools } from "./browser";
export { utilityTools, createUtilityTools } from "./utility";

export interface DefaultToolsOptions {
  processManager: ProcessManager;
  browserManager: BrowserManager;
  onDone: (summary: string) => void;
}

/**
 * Create all default tools.
 * This is the main function to get all built-in tools.
 */
export async function createDefaultTools(
  options: DefaultToolsOptions
): Promise<Record<string, Tool>> {
  const { processManager, browserManager, onDone } = options;

  // Try to use bash-tool, fall back to built-in implementation
  let bashToolsResult: Record<string, Tool>;
  try {
    bashToolsResult = await createBashTools();
  } catch {
    // bash-tool not available, use fallback
    bashToolsResult = createFallbackBashTools();
  }

  const processToolsResult = createProcessTools(processManager);
  const browserToolsResult = createBrowserTools(browserManager);
  const utilityToolsResult = createUtilityTools(onDone);

  return {
    ...bashToolsResult,
    ...processToolsResult,
    ...browserToolsResult,
    ...utilityToolsResult,
  };
}
