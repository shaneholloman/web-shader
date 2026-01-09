'use client';

import { useEffect, useRef } from 'react';
import { gpu, GPUContext } from 'ralph-gpu';

export default function FluidPage() {
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

        // Resolution for simulation
        const simRes = 256;
        const dyeRes = 1024;

        // Simulation parameters
        const densityDissipation = 0.97;
        const velocityDissipation = 0.98;
        const radius = 0.3;

        // Create ping-pong buffers for simulation
        const velocity = ctx.pingPong(simRes, simRes, {
          format: "rg16float",
          filter: "linear",
          wrap: "clamp"
        });

        const density = ctx.pingPong(dyeRes, dyeRes, {
          format: "rgba16float",
          filter: "linear",
          wrap: "clamp"
        });

        // Splat pass - add color/velocity at a point
        // Pack uniforms into vec4s for proper alignment
        const splatUniforms = {
          uTarget: { value: velocity.read },
          // Pack into vec4: xy=point, z=aspectRatio, w=radius
          params: { value: [0.5, 0.5, ctx.width / ctx.height, radius / 100] as [number, number, number, number] },
          // Pack color as vec4 (w unused)
          color: { value: [0, 0, 0, 1] as [number, number, number, number] },
        };

        const splatPass = ctx.pass(/* wgsl */ `
          @group(1) @binding(0) var uTarget: texture_2d<f32>;
          @group(1) @binding(1) var uTargetSampler: sampler;

          struct SplatParams {
            params: vec4f,
            color: vec4f,
          }
          @group(1) @binding(2) var<uniform> u: SplatParams;

          @fragment
          fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
            let uv = pos.xy / globals.resolution;
            let point = u.params.xy;
            let aspectRatio = u.params.z;
            let radius = u.params.w;
            let color = u.color.xyz;
            
            var p = uv - point;
            p.x *= aspectRatio;
            let splat = exp(-dot(p, p) / radius) * color;
            let base = textureSample(uTarget, uTargetSampler, uv).xyz;
            return vec4f(base + splat, 1.0);
          }
        `, { uniforms: splatUniforms });

        // Simple advection pass
        // Pack uniforms: xy=dt and dissipation, zw=texelSize
        const advectionUniforms = {
          uVelocity: { value: velocity.read },
          uSource: { value: velocity.read },
          params: { value: [0.016, velocityDissipation, 1/simRes, 1/simRes] as [number, number, number, number] },
        };

        const advectionPass = ctx.pass(/* wgsl */ `
          @group(1) @binding(0) var uVelocity: texture_2d<f32>;
          @group(1) @binding(1) var uVelocitySampler: sampler;
          @group(1) @binding(2) var uSource: texture_2d<f32>;
          @group(1) @binding(3) var uSourceSampler: sampler;

          struct AdvectionParams {
            params: vec4f,
          }
          @group(1) @binding(4) var<uniform> u: AdvectionParams;

          @fragment
          fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
            let uv = pos.xy / globals.resolution;
            let dt = u.params.x;
            let dissipation = u.params.y;
            let texelSize = u.params.zw;
            
            // Get velocity at this point
            let vel = textureSample(uVelocity, uVelocitySampler, uv).xy;
            
            // Trace back in time (scale velocity by texel size)
            let coord = uv - dt * vel * texelSize;
            
            // Sample source at traced position
            var result = dissipation * textureSample(uSource, uSourceSampler, coord);
            result.a = 1.0;
            return result;
          }
        `, { uniforms: advectionUniforms });

        // Display pass - render density with color mapping
        const displayUniforms = {
          uDensity: { value: density.read },
        };

        const displayPass = ctx.pass(/* wgsl */ `
          @group(1) @binding(0) var uDensity: texture_2d<f32>;
          @group(1) @binding(1) var uDensitySampler: sampler;

          @fragment
          fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
            let uv = pos.xy / globals.resolution;
            let fluid = textureSample(uDensity, uDensitySampler, uv).rgb;
            
            // Add subtle background gradient
            let bg = mix(
              vec3f(0.02, 0.02, 0.05),
              vec3f(0.05, 0.02, 0.08),
              uv.y
            );
            
            // Blend fluid visualization with background
            let finalColor = bg + fluid * 0.8;
            
            return vec4f(finalColor, 1.0);
          }
        `, { uniforms: displayUniforms });

        // Splat helper function
        function splat(x: number, y: number, dx: number, dy: number) {
          const aspectRatio = ctx!.width / ctx!.height;
          const r = radius / 100;
          
          // Splat velocity
          splatUniforms.uTarget.value = velocity.read;
          splatUniforms.params.value = [x, y, aspectRatio, r];
          splatUniforms.color.value = [dx * 0.5, dy * 0.5, 0, 1];

          ctx!.setTarget(velocity.write);
          ctx!.autoClear = false;
          splatPass.draw();
          velocity.swap();

          // Splat density with rainbow colors based on position and time
          splatUniforms.uTarget.value = density.read;
          const hue = (x * 2 + ctx!.time * 0.2) % 1;
          const color = hslToRgb(hue, 0.9, 0.6);
          splatUniforms.color.value = [color[0] * 15, color[1] * 15, color[2] * 15, 1];

          ctx!.setTarget(density.write);
          splatPass.draw();
          density.swap();
        }

        // HSL to RGB conversion
        function hslToRgb(h: number, s: number, l: number): [number, number, number] {
          let r: number, g: number, b: number;
          if (s === 0) {
            r = g = b = l;
          } else {
            const hue2rgb = (p: number, q: number, t: number): number => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
          }
          return [r, g, b];
        }

        // Track last mouse position for velocity calculation
        let lastMouseX = 0.5;
        let lastMouseY = 0.5;
        let lastTime = 0;

        function frame(timestamp: number) {
          if (disposed) return;

          const dt = Math.min((timestamp - lastTime) / 1000, 0.016);
          lastTime = timestamp;

          // Fake mouse movement using sin/cos
          const time = timestamp * 0.001;
          const mouseX = 0.5 + 0.3 * Math.sin(time);
          const mouseY = 0.5 + 0.3 * Math.cos(time * 4);

          // Calculate velocity from fake mouse movement
          const dx = (mouseX - lastMouseX) * 500;
          const dy = (mouseY - lastMouseY) * 500;

          lastMouseX = mouseX;
          lastMouseY = mouseY;

          // Add splat from fake mouse if there's movement
          if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            splat(mouseX, mouseY, dx, -dy);
          }

          // Advect velocity
          advectionUniforms.params.value = [dt, velocityDissipation, 1/simRes, 1/simRes];
          advectionUniforms.uVelocity.value = velocity.read;
          advectionUniforms.uSource.value = velocity.read;
          ctx!.setTarget(velocity.write);
          ctx!.autoClear = false;
          advectionPass.draw();
          velocity.swap();

          // Advect density (use dye resolution texel size)
          advectionUniforms.params.value = [dt, densityDissipation, 1/dyeRes, 1/dyeRes];
          advectionUniforms.uVelocity.value = velocity.read;
          advectionUniforms.uSource.value = density.read;
          ctx!.setTarget(density.write);
          advectionPass.draw();
          density.swap();

          // Display to screen
          displayUniforms.uDensity.value = density.read;
          ctx!.setTarget(null);
          ctx!.autoClear = true;
          displayPass.draw();

          animationId = requestAnimationFrame(frame);
        }
        
        frame(0);
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
    <div style={{ 
      padding: 0, 
      margin: 0, 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#0a0a0f'
    }}>
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        left: '1.5rem',
        zIndex: 10,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '1.5rem', 
          fontWeight: 600,
          letterSpacing: '-0.02em'
        }}>
          Fluid Simulation
        </h1>
        <p style={{ 
          margin: '0.5rem 0 0', 
          fontSize: '0.875rem',
          opacity: 0.6
        }}>
          GPU-accelerated fluid dynamics with automatic mouse
        </p>
      </div>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
        width={1024}
        height={768}
      />
    </div>
  );
}
