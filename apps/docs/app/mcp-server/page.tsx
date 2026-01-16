import { CodeBlock } from '@/components/mdx/CodeBlock';

// Generate the Cursor deeplink URL
const MCP_CONFIG = {
  url: "https://ralph-gpu.vercel.app/api/mcp/mcp"
};
const CONFIG_BASE64 = Buffer.from(JSON.stringify(MCP_CONFIG)).toString('base64');
const CURSOR_DEEPLINK = `cursor://anysphere.cursor-deeplink/mcp/install?name=ralph-gpu-docs&config=${CONFIG_BASE64}`;

const manualConfigCode = `{
  "mcpServers": {
    "ralph-gpu-docs": {
      "url": "https://ralph-gpu.vercel.app/api/mcp/mcp"
    }
  }
}`;

const localConfigCode = `{
  "mcpServers": {
    "ralph-gpu-docs": {
      "url": "http://localhost:3001/api/mcp/mcp"
    }
  }
}`;

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
        <CodeBlock language="json" title=".cursor/mcp.json">
          {manualConfigCode}
        </CodeBlock>
        
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-400 text-sm font-medium mb-2">Local Development</p>
          <p className="text-gray-11 text-sm mb-3">For local development, use the local URL instead:</p>
          <CodeBlock language="json">
            {localConfigCode}
          </CodeBlock>
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
