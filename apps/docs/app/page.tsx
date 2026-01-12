import Link from 'next/link';
import { CodeBlock } from '@/components/CodeBlock';

const heroCode = `import { gpu } from "ralph-gpu";

const ctx = await gpu.init(canvas);

const gradient = ctx.pass(\`
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    return vec4f(uv, sin(globals.time) * 0.5 + 0.5, 1.0);
  }
\`);

function frame() {
  gradient.draw();
  requestAnimationFrame(frame);
}
frame();`;

const features = [
  {
    title: 'Simple API',
    description: 'Write shaders, draw them. No boilerplate, no complexity.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Auto-Injected Uniforms',
    description: 'resolution, time, deltaTime, frame, and aspect available in all shaders automatically.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Ping-Pong Buffers',
    description: 'First-class support for iterative effects like fluid simulations and blur.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: 'Three.js-Style Uniforms',
    description: 'Use the familiar { value: X } pattern for reactive uniform updates.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    title: 'Compute Shaders',
    description: 'GPU-accelerated parallel computation for particles and simulations.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  {
    title: 'Blend Modes',
    description: 'Presets for additive, alpha, multiply, screen, and custom blending.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="px-4 py-8 lg:px-8 lg:py-12">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto text-center mb-20">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20">
          <span className="text-primary-400 text-sm font-medium">WebGPU Shaders Made Simple</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-gray-100 mb-6">
          ralph-gpu
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
          A minimal, ergonomic WebGPU shader library for creative coding and real-time graphics.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Link
            href="/getting-started"
            className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/examples"
            className="px-6 py-3 rounded-lg bg-gray-800 text-gray-100 font-medium hover:bg-gray-700 transition-colors"
          >
            View Examples
          </Link>
        </div>

        {/* Code Example */}
        <div className="text-left max-w-3xl mx-auto">
          <CodeBlock code={heroCode} language="typescript" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 text-center mb-12">
          Everything You Need for GPU Graphics
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 text-center mb-12">
          Explore the Documentation
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/getting-started"
            className="group p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500/50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-primary-400 transition-colors">
              Getting Started →
            </h3>
            <p className="text-gray-400">
              Installation, setup, and your first shader in minutes.
            </p>
          </Link>
          
          <Link
            href="/concepts"
            className="group p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500/50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-primary-400 transition-colors">
              Core Concepts →
            </h3>
            <p className="text-gray-400">
              Learn about contexts, passes, materials, and more.
            </p>
          </Link>
          
          <Link
            href="/api"
            className="group p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500/50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-primary-400 transition-colors">
              API Reference →
            </h3>
            <p className="text-gray-400">
              Complete documentation of all methods and properties.
            </p>
          </Link>
          
          <Link
            href="/examples"
            className="group p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-primary-500/50 transition-colors"
          >
            <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-primary-400 transition-colors">
              Examples →
            </h3>
            <p className="text-gray-400">
              Interactive demos with live code.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
