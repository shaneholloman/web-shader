'use client';

import { useCallback, useEffect, useRef } from 'react';

interface EditorFrameProps {
  initialCode: string;
  code: string;
  onChange?: (value: string) => void;
  onRun?: () => void;
}

/**
 * Renders Monaco editor in Shadow DOM using manual AMD loader
 * to avoid React portal issues with Monaco's internal DOM handling.
 * 
 * TypeScript definitions are fetched from CDN to stay in sync with the library.
 */
export function EditorFrame({ initialCode, code, onChange, onRun }: EditorFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const lastReceivedCodeRef = useRef<string>(initialCode);
  const monacoLoadedRef = useRef(false);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  // Initialize Shadow DOM and Monaco editor
  useEffect(() => {
    if (!containerRef.current || monacoLoadedRef.current) return;

    const container = containerRef.current;
    let checkInterval: NodeJS.Timeout | null = null;

    // Check if shadow root already exists
    let shadow = container.shadowRoot;
    if (!shadow) {
      shadow = container.attachShadow({ mode: 'open' });

      // Inject Monaco CSS into shadow root
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css';
      shadow.appendChild(link);

      // Create editor container
      const editorDiv = document.createElement('div');
      editorDiv.style.width = '100%';
      editorDiv.style.height = '100%';
      editorDiv.id = 'monaco-container';
      shadow.appendChild(editorDiv);
    }

    const editorDiv = shadow.querySelector('#monaco-container') as HTMLDivElement;
    if (!editorDiv) return;

    // Load Monaco via AMD loader
    monacoLoadedRef.current = true;

    // Check if require (AMD loader) is available
    if ((window as any).require && (window as any).require.config) {
      // Loader already loaded, init Monaco directly
      initMonaco(editorDiv);
    } else {
      // Check if loader script is already being loaded
      const existingLoader = document.querySelector('script[src*="monaco-editor"][src*="/loader.js"]') as HTMLScriptElement;
      
      if (existingLoader) {
        // Script exists, wait for it to load
        checkInterval = setInterval(() => {
          if ((window as any).require && (window as any).require.config) {
            if (checkInterval) clearInterval(checkInterval);
            initMonaco(editorDiv);
          }
        }, 50);
      } else {
        // Load the script
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        loaderScript.onload = () => {
          initMonaco(editorDiv);
        };
        document.head.appendChild(loaderScript);
      }
    }

    function initMonaco(editorDiv: HTMLDivElement) {
      // Skip if editor already exists for this div
      if (editorRef.current) {
        return;
      }

      const require = (window as any).require;
      
      require.config({ 
        paths: { 
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
        } 
      });

      require(['vs/editor/editor.main'], async function (monaco: any) {
        // Dispose any existing editor in this div
        const existingEditors = monaco.editor.getEditors();
        for (const ed of existingEditors) {
          const domNode = ed.getDomNode();
          if (domNode && editorDiv.contains(domNode)) {
            ed.dispose();
          }
        }

        // Double-check our ref doesn't have an editor
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }

        // Clear the editor div to ensure clean state
        editorDiv.innerHTML = '';

        // Define Vercel dark theme
        monaco.editor.defineTheme('vercel-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'fafafa', background: '000000' },
            { token: 'comment', foreground: '666666', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff7b72' },
            { token: 'keyword.control', foreground: 'ff7b72' },
            { token: 'storage', foreground: 'ff7b72' },
            { token: 'storage.type', foreground: 'ff7b72' },
            { token: 'string', foreground: 'a5d6ff' },
            { token: 'string.template', foreground: 'a5d6ff' },
            { token: 'number', foreground: '79c0ff' },
            { token: 'constant', foreground: '79c0ff' },
            { token: 'variable', foreground: 'ffa657' },
            { token: 'variable.parameter', foreground: 'ffa657' },
            { token: 'function', foreground: 'd2a8ff' },
            { token: 'type', foreground: '7ee787' },
            { token: 'type.identifier', foreground: '7ee787' },
            { token: 'class', foreground: '7ee787' },
            { token: 'interface', foreground: '7ee787' },
            { token: 'operator', foreground: 'fafafa' },
            { token: 'punctuation', foreground: 'a1a1a1' },
            { token: 'delimiter', foreground: 'a1a1a1' },
            { token: 'identifier', foreground: 'fafafa' },
          ],
          colors: {
            'editor.background': '#000000',
            'editor.foreground': '#fafafa',
            'editor.lineHighlightBackground': '#111111',
            'editor.selectionBackground': '#264f78',
            'editor.inactiveSelectionBackground': '#1a3a5c',
            'editorLineNumber.foreground': '#444444',
            'editorLineNumber.activeForeground': '#666666',
            'editorCursor.foreground': '#fafafa',
            'editorWhitespace.foreground': '#333333',
            'editorIndentGuide.background': '#222222',
            'editorIndentGuide.activeBackground': '#333333',
            'editor.selectionHighlightBackground': '#264f7840',
            'editorBracketMatch.background': '#333333',
            'editorBracketMatch.border': '#555555',
            'scrollbarSlider.background': '#33333380',
            'scrollbarSlider.hoverBackground': '#44444480',
            'scrollbarSlider.activeBackground': '#55555580',
          },
        });

        // Configure TypeScript
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ESNext,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          allowNonTsExtensions: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          strict: false,
          noEmit: true,
          lib: ['esnext', 'dom'],
        });

        // Load all ralph-gpu type files
        const typeFiles = [
          'index.d.ts',
          'context.d.ts',
          'pass.d.ts',
          'material.d.ts',
          'compute.d.ts',
          'target.d.ts',
          'ping-pong.d.ts',
          'mrt.d.ts',
          'storage.d.ts',
          'particles.d.ts',
          'sampler.d.ts',
          'errors.d.ts',
          'types.d.ts',
          'uniforms.d.ts',
          'events.d.ts',
          'event-emitter.d.ts',
          'profiler.d.ts',
        ];

        // Load each type file - Monaco will resolve imports automatically
        for (const file of typeFiles) {
          try {
            const response = await fetch(`/ralph-gpu-types/${file}`);
            const content = await response.text();

            // Use proper module paths so imports resolve
            // e.g., import from "./types" in context.d.ts will resolve to types.d.ts
            const modulePath = `file:///node_modules/ralph-gpu/dist/${file}`;
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              content,
              modulePath
            );
          } catch (error) {
            console.warn(`Failed to load ${file}:`, error);
          }
        }

        // Create module declaration that maps 'ralph-gpu' to the index.d.ts
        // This tells Monaco that import from 'ralph-gpu' should use our loaded types
        const moduleDeclaration = `
declare module 'ralph-gpu' {
  export * from 'file:///node_modules/ralph-gpu/dist/index';
}
`;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          moduleDeclaration,
          'file:///node_modules/@types/ralph-gpu/index.d.ts'
        );

        // Suppress diagnostics
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          diagnosticCodesToIgnore: [1378, 2345, 2531, 2792],
        });

        // Create editor
        const editor = monaco.editor.create(editorDiv, {
          value: initialCode,
          language: 'typescript',
          theme: 'vercel-dark',
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'Geist Mono', 'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        });

        editorRef.current = editor;

        // Fix Shadow DOM keyboard event handling
        // Ensure Monaco's textarea is properly configured and focused
        const domNode = editor.getDomNode();
        if (domNode) {
          // Give the editor focus to activate keyboard input
          setTimeout(() => {
            editor.focus();
          }, 50);
        }

        // Listen for content changes
        editor.onDidChangeModelContent(() => {
          const value = editor.getValue();
          lastReceivedCodeRef.current = value;
          onChangeRef.current?.(value);
        });

        // Add Cmd/Ctrl+Enter shortcut
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          onRunRef.current?.();
        });

        // Force layout refresh
        setTimeout(() => {
          editor.layout();
        }, 100);
      });
    }

    // Cleanup
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      // Reset flag so Monaco can re-initialize on next mount
      monacoLoadedRef.current = false;
    };
  }, [initialCode]);

  // Handle external code changes (e.g., switching examples)
  useEffect(() => {
    if (editorRef.current && code !== lastReceivedCodeRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        model.setValue(code);
        lastReceivedCodeRef.current = code;
      }
    }
  }, [code]);

  return <div ref={containerRef} className="w-full h-full" />;
}
