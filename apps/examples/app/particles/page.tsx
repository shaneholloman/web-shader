'use client';

import { useEffect, useRef } from 'react';
import { gpu, GPUContext } from 'ralph-gpu';

export default function ParticlesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    let ctx: GPUContext | null = null;
    let disposed = false;
    
    async function init() {
      if (!canvasRef.current) return;
      
      try {
        if (!gpu.isSupported()) {
          console.error('WebGPU is not supported in this browser');
          return;
        }

        ctx = await gpu.init(canvasRef.current, {
          dpr: Math.min(window.devicePixelRatio, 2),
          debug: true,
        });

        if (disposed) {
          ctx.dispose();
          return;
        }

        // Grid parameters
        const gridX = 20;
        const gridY = 10;
        const particleCount = gridX * gridY;

        // Create storage buffer for particle positions
        // Each particle: x, y, colorHue, size (4 floats = 16 bytes)
        const particleBuffer = ctx.storage(particleCount * 4 * 4);

        // Initialize particle positions in a grid
        const initialData = new Float32Array(particleCount * 4);
        for (let y = 0; y < gridY; y++) {
          for (let x = 0; x < gridX; x++) {
            const i = (y * gridX + x) * 4;
            // Position: -1 to 1 range, centered
            initialData[i + 0] = ((x + 0.5) / gridX) * 2 - 1; // x position
            initialData[i + 1] = ((y + 0.5) / gridY) * 2 - 1; // y position
            initialData[i + 2] = (x + y) / (gridX + gridY); // color hue
            initialData[i + 3] = 0.03; // size
          }
        }
        particleBuffer.write(initialData);

        // Material for rendering particles using instanced quads
        const particleMaterial = ctx.material(/* wgsl */ `
          struct Particle {
            pos: vec2f,
            hue: f32,
            size: f32,
          }

          @group(1) @binding(0) var<storage, read> particles: array<Particle>;

          struct VertexOutput {
            @builtin(position) pos: vec4f,
            @location(0) uv: vec2f,
            @location(1) hue: f32,
          }

          @vertex
          fn vs_main(
            @builtin(vertex_index) vid: u32,
            @builtin(instance_index) iid: u32
          ) -> VertexOutput {
            let particle = particles[iid];
            
            // Quad vertices (two triangles)
            var quadPos = array<vec2f, 6>(
              vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
              vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
            );
            
            // Scale by particle size and aspect ratio
            let aspect = globals.resolution.x / globals.resolution.y;
            let size = particle.size;
            let localPos = quadPos[vid] * vec2f(size / aspect, size);
            
            // Offset by particle position
            let worldPos = particle.pos + localPos;
            
            var out: VertexOutput;
            out.pos = vec4f(worldPos, 0.0, 1.0);
            out.uv = quadPos[vid] * 0.5 + 0.5;
            out.hue = particle.hue;
            return out;
          }

          @fragment
          fn fs_main(in: VertexOutput) -> @location(0) vec4f {
            // Distance from center of quad
            let d = length(in.uv - 0.5);
            
            // Discard pixels outside the circle
            if (d > 0.5) { discard; }
            
            // Smooth circular edge
            let alpha = smoothstep(0.5, 0.3, d);
            
            // Rainbow color based on hue
            let hue = in.hue;
            let color = vec3f(
              0.5 + 0.5 * sin(hue * 6.28 + 0.0),
              0.5 + 0.5 * sin(hue * 6.28 + 2.09),
              0.5 + 0.5 * sin(hue * 6.28 + 4.19)
            );
            
            return vec4f(color, alpha);
          }
        `, {
          vertexCount: 6,
          instances: particleCount,
          blend: "alpha",
        });

        particleMaterial.storage("particles", particleBuffer);

        function frame() {
          if (disposed) return;
          
          particleMaterial.draw();
          
          animationId = requestAnimationFrame(frame);
        }
        
        frame();
      } catch (error) {
        console.error('Failed to initialize WebGPU:', error);
      }
    }

    init();

    return () => {
      disposed = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (ctx) {
        ctx.dispose();
      }
    };
  }, []);

  return (
    <div style={{ padding: '2rem', height: '100vh' }}>
      <h1 style={{ marginBottom: '1rem' }}>Simple Particles (Instanced Grid)</h1>
      <p style={{ marginBottom: '1rem' }}>
        A grid of colorful dots rendered using instanced quads and storage buffers.
      </p>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '400px',
          border: '1px solid #333',
          display: 'block',
          backgroundColor: '#000'
        }}
        width={800}
        height={400}
      />
    </div>
  );
}
