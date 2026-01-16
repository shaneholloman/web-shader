import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'tsx', 'jsx', 'json', 'bash', 'html', 'css', 'wgsl'],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, language: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code.trim(), {
    lang: language,
    theme: 'github-dark',
  });
}
