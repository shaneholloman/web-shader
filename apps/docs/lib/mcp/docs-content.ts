import { readFileSync } from "fs";
import { join } from "path";

const CURSOR_RULE_PATH = join(process.cwd(), "../../.cursor/rules/ralph-gpu.mdc");
const DOCS_CONTENT_DIR = join(process.cwd(), "lib/mcp/content");

// Returns the comprehensive quickstart guide (same as cursor rule)
export function getQuickstartGuide(): string {
  try {
    const content = readFileSync(CURSOR_RULE_PATH, "utf-8");
    // Remove the frontmatter (---...---)
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, "");
    return withoutFrontmatter;
  } catch (error) {
    return "Quickstart guide not found. Error: " + String(error);
  }
}

export function getDocContent(topic: string): string {
  const filePath = join(DOCS_CONTENT_DIR, `${topic}.md`);
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    // Fallback: return a placeholder message
    return `Documentation for '${topic}' is being prepared. Please use get_started for comprehensive documentation.`;
  }
}