'use client';

import { useEffect, useRef, useState } from 'react';
import { gpu, GPUContext } from 'ralph-gpu';

export default function TerrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let animationId: number;
    let ctx: GPUContext | null = null;
    let disposed = false;
    let lastTime = performance.now();
    let frameCount = 0;
    
    async function init() {
      if (!canvasRef.current) return;
      
      try {
        if (!gpu.isSupported()) {
          console.error('WebGPU is not supported in this browser');
          return;
        }

        // Use autoResize - defaults to DPR capped at 2
        ctx = await gpu.init(canvasRef.current, {
          autoResize: true,
          debug: false,
        });

        if (disposed) {
          ctx.dispose();
          return;
        }

        const terrain = ctx.pass(/* wgsl */ `
          // Constants - optimized
          const MAX_STEPS: i32 = 128;
          const MAX_DIST: f32 = 150.0;
          const SURF_DIST: f32 = 0.015;
          const PI: f32 = 3.14159265359;
          const WATER_LEVEL: f32 = 0.3;

          // Fast hash
          fn hash(p: vec2f) -> f32 {
            var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
            p3 += dot(p3, p3.yzx + 3.333);
            return fract((p3.x + p3.y) * p3.z);
          }

          // Value noise
          fn noise(p: vec2f) -> f32 {
            let i = floor(p);
            let f = fract(p);
            let u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i), hash(i + vec2f(1.0, 0.0)), u.x),
              mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
              u.y
            );
          }

          // FBM - 4 octaves for speed
          fn fbm(p: vec2f) -> f32 {
            var v = 0.0;
            var a = 0.5;
            var pos = p;
            for (var i = 0; i < 4; i++) {
              v += a * noise(pos);
              a *= 0.5;
              pos = vec2f(pos.x * 0.8 - pos.y * 0.6, pos.x * 0.6 + pos.y * 0.8) * 2.0;
            }
            return v;
          }

          // Terrain height - simplified
          fn terrainHeight(p: vec2f) -> f32 {
            let scale = 0.025;
            var h = fbm(p * scale) * 0.8;
            h += pow(abs(noise(p * scale * 1.5) - 0.5) * 2.0, 1.5) * 0.3;
            return h * 12.0 - 2.0;
          }

          fn mapTerrain(p: vec3f) -> f32 {
            return p.y - terrainHeight(p.xz);
          }

          fn mapWater(p: vec3f, time: f32) -> f32 {
            let w = time * 0.5;
            return p.y - WATER_LEVEL - sin(p.x * 0.5 + w) * cos(p.z * 0.3 + w * 0.7) * 0.03;
          }

          struct SceneResult { dist: f32, material: i32 }

          fn map(p: vec3f, time: f32) -> SceneResult {
            let t = mapTerrain(p);
            let w = mapWater(p, time);
            var r: SceneResult;
            r.dist = min(t, w);
            r.material = select(1, 0, t < w);
            return r;
          }

          fn terrainNormal(p: vec3f) -> vec3f {
            let e = vec2f(0.1, 0.0);
            return normalize(vec3f(
              terrainHeight(p.xz - e.xy) - terrainHeight(p.xz + e.xy),
              0.2,
              terrainHeight(p.xz - e.yx) - terrainHeight(p.xz + e.yx)
            ));
          }

          fn raymarch(ro: vec3f, rd: vec3f, time: f32) -> SceneResult {
            var t = 0.1;
            var r: SceneResult;
            r.dist = MAX_DIST;
            r.material = -1;
            for (var i = 0; i < MAX_STEPS; i++) {
              let p = ro + rd * t;
              let res = map(p, time);
              if (res.dist < SURF_DIST * t) {
                r.dist = t;
                r.material = res.material;
                break;
              }
              if (t > MAX_DIST) { break; }
              t += res.dist * 0.95;
            }
            return r;
          }

          fn sky(rd: vec3f, sunDir: vec3f) -> vec3f {
            var c = mix(vec3f(0.5, 0.65, 0.85), vec3f(0.15, 0.35, 0.75), pow(max(rd.y, 0.0), 0.4));
            c = mix(c, vec3f(0.85, 0.75, 0.65), pow(1.0 - abs(rd.y), 6.0) * 0.4);
            let s = max(dot(rd, sunDir), 0.0);
            c += pow(s, 256.0) * vec3f(1.0, 0.95, 0.8) * 8.0;
            c += pow(s, 8.0) * vec3f(1.0, 0.7, 0.4) * 0.4;
            return c;
          }

          fn applyFog(col: vec3f, dist: f32, rd: vec3f, sunDir: vec3f) -> vec3f {
            let fog = 1.0 - exp(-max(0.0, dist - 60.0) * 0.012);
            return mix(col, sky(rd, sunDir) * 0.85, fog);
          }

          // Simplified materials - single noise lookup each
          fn grassColor(p: vec3f, slope: f32) -> vec3f {
            let n = noise(p.xz * 0.4);
            let grass = mix(vec3f(0.18, 0.38, 0.1), vec3f(0.28, 0.48, 0.15), n);
            let dirt = vec3f(0.25, 0.2, 0.12);
            return mix(grass, dirt, smoothstep(0.25, 0.55, slope));
          }

          fn rockColor(p: vec3f, n: vec3f) -> vec3f {
            let d = noise(p.xz * 0.6 + p.y * 0.3);
            var rock = mix(vec3f(0.35, 0.32, 0.28), vec3f(0.45, 0.42, 0.38), d);
            rock = mix(rock, vec3f(0.38, 0.4, 0.32), max(0.0, n.y) * 0.25);
            return rock;
          }

          fn snowColor(p: vec3f, slope: f32) -> vec3f {
            let d = noise(p.xz * 1.5);
            let snow = mix(vec3f(0.88, 0.92, 0.98), vec3f(0.95, 0.97, 1.0), d);
            return mix(snow, vec3f(0.82, 0.88, 0.95), smoothstep(0.3, 0.6, slope) * 0.4);
          }

          @fragment
          fn main(@builtin(position) fc: vec4f) -> @location(0) vec4f {
            var uv = (fc.xy - 0.5 * globals.resolution) / globals.resolution.y;
            uv.y = -uv.y;
            let time = globals.time;
            
            let fly = time * 6.0;
            let camH = 4.0 + sin(time * 0.25) * 1.5;
            let ro = vec3f(fly, camH + terrainHeight(vec2f(fly, 0.0)) + 4.0, 0.0);
            
            let lookAt = vec3f(fly + 25.0, camH - 1.0, sin(time * 0.15) * 8.0);
            let fwd = normalize(lookAt - ro);
            let rgt = normalize(cross(vec3f(0.0, 1.0, 0.0), fwd));
            let up = cross(fwd, rgt);
            let rd = normalize(fwd + uv.x * rgt + uv.y * up);
            
            let sunDir = normalize(vec3f(cos(time * 0.03), 0.5, sin(time * 0.03)));
            let hit = raymarch(ro, rd, time);
            
            var col = vec3f(0.0);
            
            if (hit.dist < MAX_DIST) {
              let p = ro + rd * hit.dist;
              
              if (hit.material == 0) {
                let n = terrainNormal(p);
                let slope = 1.0 - n.y;
                let h = p.y;
                
                // Material zones
                let grass = grassColor(p, slope);
                let rock = rockColor(p, n);
                let snow = snowColor(p, slope);
                let sand = vec3f(0.55, 0.5, 0.38);
                
                // Blend by height and slope
                var mat = sand;
                mat = mix(mat, grass, smoothstep(0.4, 1.2, h) * (1.0 - smoothstep(3.0, 4.5, h)));
                mat = mix(mat, rock, smoothstep(0.4, 0.7, slope));
                mat = mix(mat, rock * 0.95, smoothstep(3.5, 5.0, h) * (1.0 - slope));
                mat = mix(mat, snow, smoothstep(4.5, 6.0, h) * (1.0 - slope * 1.3));
                
                // Lighting
                let diff = max(dot(n, sunDir), 0.0);
                let amb = vec3f(0.2, 0.25, 0.35) * (0.6 + 0.4 * n.y);
                col = amb * mat + mat * diff * vec3f(1.0, 0.95, 0.85);
                
              } else {
                // Water
                let viewDir = normalize(ro - p);
                let n = vec3f(0.0, 1.0, 0.0);
                let refl = sky(reflect(-viewDir, n), sunDir);
                let fres = pow(1.0 - max(dot(viewDir, n), 0.0), 4.0);
                col = mix(vec3f(0.08, 0.2, 0.35), refl, fres * 0.7);
                col += pow(max(dot(reflect(-viewDir, n), sunDir), 0.0), 256.0) * 1.2;
              }
              
              col = applyFog(col, hit.dist, rd, sunDir);
            } else {
              col = sky(rd, sunDir);
            }
            
            // Tone mapping + gamma
            col = col / (col + 1.0);
            col = pow(col, vec3f(0.45));
            col *= 1.0 - 0.12 * length(uv);
            
            return vec4f(col, 1.0);
          }
        `);

        function frame() {
          if (disposed) return;
          terrain.draw();
          
          // FPS counter
          frameCount++;
          const now = performance.now();
          if (now - lastTime >= 1000) {
            setFps(Math.round(frameCount * 1000 / (now - lastTime)));
            frameCount = 0;
            lastTime = now;
          }
          
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
      <h1 style={{ marginBottom: '1rem' }}>Infinite Terrain</h1>
      <p style={{ marginBottom: '1rem' }}>
        Procedural infinite terrain using raymarching with FBM noise for height, 
        atmospheric fog, water with reflections, and a dynamic sky with sun.
      </p>
      <div style={{ 
        position: 'absolute', 
        top: '2rem', 
        right: '2rem', 
        background: 'rgba(0,0,0,0.7)', 
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '1.2rem',
        color: fps > 30 ? '#4f4' : fps > 15 ? '#ff4' : '#f44'
      }}>
        {fps} FPS
      </div>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 150px)',
          border: '1px solid #333',
          display: 'block',
          background: '#000'
        }}
        width={1280}
        height={720}
      />
    </div>
  );
}
