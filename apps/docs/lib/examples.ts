export interface Example {
  slug: string;
  title: string;
  description: string;
  shader?: string;  // WGSL shader for simple single-pass examples
  code: string;     // Full API code for display and execution
  uniforms?: Record<string, { value: number | number[] }>;
  animated?: boolean;
  // If true, execute the full code instead of extracting shader
  // Required for multi-pass examples (pingPong, render targets, etc.)
  executable?: boolean;
}

export const examples: Example[] = [
  {
    slug: 'gradient',
    title: 'Simple Gradient',
    description: 'The simplest possible shader — map UV coordinates to colors. This creates a gradient from black (bottom-left) to cyan (top-right).',
    shader: `
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    return vec4f(uv, 0.5, 1.0);
  }
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a fragment shader pass
const gradient = ctx.pass(\`
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    return vec4f(uv, 0.5, 1.0);
  }
\`);

// Render loop
function frame() {
  gradient.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    animated: false,
  },
  {
    slug: 'wave',
    title: 'Animated Wave',
    description: 'A glowing sine wave with custom uniforms. The wave animates over time using globals.time.',
    shader: `
  struct Params { amplitude: f32, frequency: f32, color: vec3f }
  @group(1) @binding(0) var<uniform> u: Params;

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let wave = sin(uv.x * u.frequency + globals.time * 2.0) * u.amplitude;
    let d = abs(uv.y - 0.5 - wave);
    let glow = 0.02 / d;
    return vec4f(u.color * glow, 1.0);
  }
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Define parameters
const params = {
  amplitude: { value: 0.3 },
  frequency: { value: 8.0 },
  color: { value: [0.2, 0.8, 1.0] }
};

// Create a fragment shader pass with uniforms
const wave = ctx.pass(\`
  struct Params { amplitude: f32, frequency: f32, color: vec3f }
  @group(1) @binding(0) var<uniform> u: Params;

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let w = sin(uv.x * u.frequency + globals.time * 2.0) * u.amplitude;
    let d = abs(uv.y - 0.5 - w);
    let glow = 0.02 / d;
    return vec4f(u.color * glow, 1.0);
  }
\`, { uniforms: params });

// Render loop
function frame() {
  wave.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    uniforms: {
      amplitude: { value: 0.3 },
      frequency: { value: 8.0 },
      color: { value: [0.2, 0.8, 1.0] },
    },
    animated: true,
  },
  {
    slug: 'color-cycle',
    title: 'Time-Based Color Cycling',
    description: 'A hypnotic pattern that cycles through colors over time. Combines time, distance, and angle for a mesmerizing effect.',
    shader: `
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let t = globals.time * 0.5;
    
    // Cycle through hues
    let r = sin(t) * 0.5 + 0.5;
    let g = sin(t + 2.094) * 0.5 + 0.5;
    let b = sin(t + 4.188) * 0.5 + 0.5;
    
    // Create radial pattern
    let center = uv - 0.5;
    let dist = length(center);
    let angle = atan2(center.y, center.x);
    let pattern = sin(dist * 20.0 - globals.time * 3.0 + angle * 3.0);
    
    let color = vec3f(r, g, b) * (pattern * 0.3 + 0.7);
    return vec4f(color, 1.0);
  }
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a fragment shader pass
const colorCycle = ctx.pass(\`
  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let t = globals.time * 0.5;
    
    // Cycle through hues
    let r = sin(t) * 0.5 + 0.5;
    let g = sin(t + 2.094) * 0.5 + 0.5;
    let b = sin(t + 4.188) * 0.5 + 0.5;
    
    // Create radial pattern
    let center = uv - 0.5;
    let dist = length(center);
    let angle = atan2(center.y, center.x);
    let pattern = sin(dist * 20.0 - globals.time * 3.0 + angle * 3.0);
    
    let color = vec3f(r, g, b) * (pattern * 0.3 + 0.7);
    return vec4f(color, 1.0);
  }
\`);

// Render loop
function frame() {
  colorCycle.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'raymarching',
    title: 'Raymarching Sphere',
    description: 'A basic 3D sphere rendered using raymarching. This demonstrates how to create 3D shapes and lighting entirely within a fragment shader.',
    shader: `
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / min(globals.resolution.x, globals.resolution.y);
  
  // Camera
  let ro = vec3f(0.0, 0.0, -3.0);
  let rd = normalize(vec3f(uv, 1.0));
  
  // Raymarching
  var t = 0.0;
  for (var i = 0; i < 64; i++) {
    let p = ro + rd * t;
    let d = length(p) - 1.0; // sphere SDF
    if (d < 0.001) { break; }
    t += d;
  }
  
  // Shading
  let p = ro + rd * t;
  let n = normalize(p);
  let light = normalize(vec3f(1.0, 1.0, -1.0));
  let diff = max(dot(n, light), 0.0);
  
  let col = vec3f(0.2, 0.5, 1.0) * (diff * 0.8 + 0.2);
  
  // If we missed everything, return background
  if (t > 10.0) {
    return vec4f(0.1, 0.1, 0.15, 1.0);
  }
  
  return vec4f(col, 1.0);
}
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a raymarching pass
const raymarch = ctx.pass(\`
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / min(globals.resolution.x, globals.resolution.y);
  
  // Camera
  let ro = vec3f(0.0, 0.0, -3.0);
  let rd = normalize(vec3f(uv, 1.0));
  
  // Raymarching
  var t = 0.0;
  for (var i = 0; i < 64; i++) {
    let p = ro + rd * t;
    let d = length(p) - 1.0; // sphere SDF
    if (d < 0.001) { break; }
    t += d;
  }
  
  // Shading
  let p = ro + rd * t;
  let n = normalize(p);
  let light = normalize(vec3f(1.0, 1.0, -1.0));
  let diff = max(dot(n, light), 0.0);
  
  let col = vec3f(0.2, 0.5, 1.0) * (diff * 0.8 + 0.2);
  
  // If we missed everything, return background
  if (t > 10.0) {
    return vec4f(0.1, 0.1, 0.15, 1.0);
  }
  
  return vec4f(col, 1.0);
}
\`);

// Render loop
function frame() {
  raymarch.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'noise',
    title: 'Perlin-style Noise',
    description: 'Layered fractional Brownian motion (fBm) noise. This technique is fundamental for generating procedural textures, terrain, and natural-looking patterns.',
    shader: `
// Include a simple hash function and noise
fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

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

@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / globals.resolution;
  var n = 0.0;
  var amp = 0.5;
  var freq = 4.0;
  for (var i = 0; i < 5; i++) {
    n += amp * noise(uv * freq + globals.time * 0.5);
    amp *= 0.5;
    freq *= 2.0;
  }
  return vec4f(vec3f(n), 1.0);
}
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a noise pass
const noisePass = ctx.pass(\`
// Include a simple hash function and noise
fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

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

@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / globals.resolution;
  var n = 0.0;
  var amp = 0.5;
  var freq = 4.0;
  for (var i = 0; i < 5; i++) {
    n += amp * noise(uv * freq + globals.time * 0.5);
    amp *= 0.5;
    freq *= 2.0;
  }
  return vec4f(vec3f(n), 1.0);
}
\`);

// Render loop
function frame() {
  noisePass.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'metaballs',
    title: 'Metaballs',
    description: 'Organic-looking "blobs" that merge together based on an implicit surface. This effect uses a distance-based field and a threshold to create smooth blending.',
    shader: `
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / globals.resolution.y;
  
  // Ball positions (animated)
  let t = globals.time;
  let p1 = vec2f(sin(t) * 0.3, cos(t * 1.3) * 0.3);
  let p2 = vec2f(sin(t * 0.7 + 2.0) * 0.3, cos(t) * 0.3);
  let p3 = vec2f(sin(t * 1.2 + 4.0) * 0.3, cos(t * 0.8 + 1.0) * 0.3);
  
  // Metaball field
  let r = 0.1;
  let field = r / length(uv - p1) + r / length(uv - p2) + r / length(uv - p3);
  
  // Threshold and color
  let threshold = 1.0;
  let c = smoothstep(threshold, threshold + 0.1, field);
  let col = mix(vec3f(0.1, 0.1, 0.2), vec3f(0.2, 0.8, 1.0), c);
  
  return vec4f(col, 1.0);
}
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a metaballs pass
const metaballs = ctx.pass(\`
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / globals.resolution.y;
  
  // Ball positions (animated)
  let t = globals.time;
  let p1 = vec2f(sin(t) * 0.3, cos(t * 1.3) * 0.3);
  let p2 = vec2f(sin(t * 0.7 + 2.0) * 0.3, cos(t) * 0.3);
  let p3 = vec2f(sin(t * 1.2 + 4.0) * 0.3, cos(t * 0.8 + 1.0) * 0.3);
  
  // Metaball field
  let r = 0.1;
  let field = r / length(uv - p1) + r / length(uv - p2) + r / length(uv - p3);
  
  // Threshold and color
  let threshold = 1.0;
  let c = smoothstep(threshold, threshold + 0.1, field);
  let col = mix(vec3f(0.1, 0.1, 0.2), vec3f(0.2, 0.8, 1.0), c);
  
  return vec4f(col, 1.0);
}
\`);

// Render loop
function frame() {
  metaballs.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'fractal',
    title: 'Mandelbrot Set',
    description: 'The classic complex number fractal. This shader computes the set by iterating z = z² + c and mapping the escape time to vibrant colors.',
    shader: `
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / globals.resolution.y;
  
  // Zoom around interesting area
  let zoom = 1.5;
  let c = uv * zoom + vec2f(-0.7, 0.0);
  
  var z = vec2f(0.0);
  var iter = 0;
  let max_iter = 100;
  
  for (var i = 0; i < max_iter; i++) {
    z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) {
      break;
    }
    iter = i;
  }
  
  if (iter == max_iter - 1) {
    return vec4f(0.0, 0.0, 0.05, 1.0);
  }
  
  let t = f32(iter) / f32(max_iter);
  let col = vec3f(
    0.5 + 0.5 * sin(t * 10.0 + globals.time * 0.5),
    0.5 + 0.5 * sin(t * 10.0 + 2.0 + globals.time * 0.3),
    0.5 + 0.5 * sin(t * 10.0 + 4.0 + globals.time * 0.4)
  );
  
  return vec4f(col * 1.2, 1.0);
}
`,
    code: `import { gpu } from 'ralph-gpu';

// Initialize WebGPU context
const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Create a fractal pass that explores the Mandelbrot set
const fractal = ctx.pass(\`
@fragment
fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - globals.resolution * 0.5) / globals.resolution.y;
  
  // Zoom around interesting area
  let zoom = 1.5;
  let c = uv * zoom + vec2f(-0.7, 0.0);
  
  var z = vec2f(0.0);
  var iter = 0;
  let max_iter = 100;
  
  for (var i = 0; i < max_iter; i++) {
    z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) {
      break;
    }
    iter = i;
  }
  
  if (iter == max_iter - 1) {
    return vec4f(0.0, 0.0, 0.05, 1.0);
  }
  
  let t = f32(iter) / f32(max_iter);
  let col = vec3f(
    0.5 + 0.5 * sin(t * 10.0 + globals.time * 0.5),
    0.5 + 0.5 * sin(t * 10.0 + 2.0 + globals.time * 0.3),
    0.5 + 0.5 * sin(t * 10.0 + 4.0 + globals.time * 0.4)
  );
  
  return vec4f(col * 1.2, 1.0);
}
\`);

// Render loop
function frame() {
  fractal.draw();
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'alien-planet',
    title: 'Alien Planet',
    description: 'A procedurally generated alien world with atmospheric scattering, orbiting moon, and particle-based starfield.',
    shader: `
const MAX_STEPS: i32 = 100;
const MAX_DIST: f32 = 200.0;
const SURF_DIST: f32 = 0.001;
const PI: f32 = 3.14159265359;
const PLANET_RADIUS: f32 = 8.0;
const PLANET_POS: vec3f = vec3f(0.0, 0.0, 30.0);
const ATMOSPHERE_RADIUS: f32 = 9.5;
const MOON_RADIUS: f32 = 1.5;

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash31(p: vec3f) -> f32 {
  var p3 = fract(p * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash33(p: vec3f) -> vec3f {
  var p3 = fract(p * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

fn noise3D(p: vec3f) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3f(1.0, 0.0, 0.0)), u.x),
    mix(hash31(i + vec3f(0.0, 1.0, 0.0)), hash31(i + vec3f(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash31(i + vec3f(0.0, 0.0, 1.0)), hash31(i + vec3f(1.0, 0.0, 1.0)), u.x),
    mix(hash31(i + vec3f(0.0, 1.0, 1.0)), hash31(i + vec3f(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

fn fbm(p: vec3f) -> f32 {
  var v: f32 = 0.0; var a: f32 = 0.5; var pos = p;
  for (var i = 0; i < 5; i++) { v += a * noise3D(pos); a *= 0.5; pos *= 2.0; }
  return v;
}

fn sdPlanet(p: vec3f) -> f32 {
  let lp = p - PLANET_POS;
  let base = length(lp) - PLANET_RADIUS;
  let noise = fbm(normalize(lp) * 8.0) * 0.3;
  let crater = pow(fbm(normalize(lp) * 4.0 + 10.0), 2.0) * 0.2;
  return base - noise + crater;
}

fn getMoonPos(time: f32) -> vec3f {
  return PLANET_POS + vec3f(cos(time * 0.15) * 16.0, sin(time * 0.1) * 5.0, sin(time * 0.15) * 14.0);
}

fn sdMoon(p: vec3f, time: f32) -> f32 {
  let lp = p - getMoonPos(time);
  return length(lp) - MOON_RADIUS - fbm(normalize(lp) * 6.0) * 0.08;
}

struct Hit { dist: f32, mat: i32 }

fn map(p: vec3f, time: f32) -> Hit {
  var h: Hit; h.dist = MAX_DIST; h.mat = 0;
  let pd = sdPlanet(p); if (pd < h.dist) { h.dist = pd; h.mat = 1; }
  let md = sdMoon(p, time); if (md < h.dist) { h.dist = md; h.mat = 2; }
  return h;
}

fn calcNormal(p: vec3f, time: f32) -> vec3f {
  let e = vec2f(0.001, 0.0);
  return normalize(vec3f(map(p + e.xyy, time).dist - map(p - e.xyy, time).dist,
    map(p + e.yxy, time).dist - map(p - e.yxy, time).dist,
    map(p + e.yyx, time).dist - map(p - e.yyx, time).dist));
}

fn atmosphere(ro: vec3f, rd: vec3f) -> vec3f {
  let oc = ro - PLANET_POS; let b = dot(oc, rd); let c = dot(oc, oc) - ATMOSPHERE_RADIUS * ATMOSPHERE_RADIUS;
  let h = b * b - c; if (h < 0.0) { return vec3f(0.0); }
  let t1 = max(-b - sqrt(h), 0.0); let t2 = -b + sqrt(h); if (t2 < 0.0) { return vec3f(0.0); }
  var scatter = vec3f(0.0); let step = (t2 - t1) / 8.0;
  for (var i = 0; i < 8; i++) {
    let t = t1 + (f32(i) + 0.5) * step;
    let sp = ro + rd * t;
    let alt = (length(sp - PLANET_POS) - PLANET_RADIUS) / (ATMOSPHERE_RADIUS - PLANET_RADIUS);
    let den = exp(-alt * 4.0);
    scatter += (vec3f(0.2, 0.5, 1.0) + vec3f(1.0, 0.4, 0.2) * 0.3) * den * step * 0.15;
  }
  return scatter;
}

fn getPlanetColor(p: vec3f, time: f32) -> vec3f {
  let lp = p - PLANET_POS; let sc = normalize(lp);
  let n1 = fbm(sc * 4.0); let n2 = fbm(sc * 8.0 + 10.0);
  var col = mix(vec3f(0.6, 0.2, 0.4), vec3f(0.2, 0.5, 0.4), n1);
  col = mix(col, vec3f(0.8, 0.6, 0.3), n2 * 0.5);
  let polar = abs(sc.y);
  if (polar > 0.7) { col = mix(col, vec3f(0.7, 0.8, 0.9), smoothstep(0.7, 0.9, polar)); }
  let bio = fbm(sc * 12.0 + time * 0.05);
  if (bio > 0.65) { col += vec3f(0.2, 1.0, 0.6) * (bio - 0.65) * 0.5; }
  return col;
}

@fragment
fn main(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  var uv = (fc.xy - 0.5 * globals.resolution) / globals.resolution.y;
  uv.y = -uv.y;
  let time = globals.time;
  let camDist = 75.0 - time * 0.3; let camAngle = time * 0.05;
  let ro = vec3f(sin(camAngle) * 20.0, sin(time * 0.1) * 4.0 + 8.0, camDist);
  let forward = normalize(PLANET_POS - ro);
  let right = normalize(cross(vec3f(0.0, 1.0, 0.0), forward));
  let up = cross(forward, right);
  let rd = normalize(forward + uv.x * right + uv.y * up);
  let sunDir = normalize(vec3f(0.5, 0.3, -1.0));
  
  // Background with nebula and sun glow (stars rendered separately as particles)
  var col = vec3f(0.0);
  col += pow(max(dot(rd, sunDir), 0.0), 256.0) * 2.0 * vec3f(1.0, 0.9, 0.7);
  col += pow(max(dot(rd, sunDir), 0.0), 8.0) * 0.3 * vec3f(1.0, 0.9, 0.7);
  
  let nc = rd * 2.0;
  let neb1 = fbm(nc + vec3f(0.0, 0.0, time * 0.01));
  let neb2 = fbm(nc * 2.0 + vec3f(100.0, 0.0, time * 0.02));
  col += mix(vec3f(0.1, 0.0, 0.15), vec3f(0.0, 0.1, 0.2), neb1) * neb2 * 0.15;
  
  var t: f32 = 0.0; var hit: Hit; hit.mat = 0;
  for (var i = 0; i < MAX_STEPS; i++) {
    let p = ro + rd * t; let h = map(p, time);
    if (h.dist < SURF_DIST) { hit = h; break; }
    if (t > MAX_DIST) { break; }
    t += h.dist * 0.8;
  }
  
  if (hit.mat > 0) {
    let p = ro + rd * t; let n = calcNormal(p, time);
    var mc = vec3f(0.5);
    if (hit.mat == 1) { mc = getPlanetColor(p, time); }
    else if (hit.mat == 2) { mc = vec3f(0.5, 0.5, 0.55) * fbm(n * 8.0); }
    
    let diff = max(dot(n, sunDir), 0.0);
    let vd = normalize(ro - p);
    let hd = normalize(sunDir + vd);
    let spec = pow(max(dot(n, hd), 0.0), 32.0);
    let fres = pow(1.0 - max(dot(vd, n), 0.0), 4.0);
    
    var sc = vec3f(0.02, 0.03, 0.05) * mc + mc * vec3f(1.0, 0.95, 0.9) * diff + vec3f(1.0, 0.9, 0.8) * spec * 0.3;
    if (hit.mat == 1) { sc += vec3f(0.3, 0.5, 1.0) * fres * 0.5; }
    col = sc;
  } else {
    // Only add atmosphere if we didn't hit the planet/moon
    col += atmosphere(ro, rd);
  }
  
  col = col / (col + vec3f(1.0));
  col = pow(col, vec3f(0.95, 1.0, 1.05));
  col = pow(col, vec3f(1.0 / 2.2));
  col *= 1.0 - 0.3 * length(uv);
  return vec4f(col, 1.0);
}
`,
    code: `import { gpu } from 'ralph-gpu';

const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true });

// Shared camera function
const getCamera = (time, aspect) => {
  const camDist = 75.0 - time * 0.3;
  const camAngle = time * 0.05;
  const ro = [Math.sin(camAngle) * 20.0, Math.sin(time * 0.1) * 4.0 + 8.0, camDist];
  const target = [0.0, 0.0, 30.0];
  const forward = [target[0] - ro[0], target[1] - ro[1], target[2] - ro[2]];
  const len = Math.sqrt(forward[0]**2 + forward[1]**2 + forward[2]**2);
  forward[0] /= len; forward[1] /= len; forward[2] /= len;
  const right = [forward[2], 0, -forward[0]];
  const rlen = Math.sqrt(right[0]**2 + right[2]**2);
  right[0] /= rlen; right[2] /= rlen;
  const up = [right[1]*forward[2] - right[2]*forward[1], right[2]*forward[0] - right[0]*forward[2], right[0]*forward[1] - right[1]*forward[0]];
  return { ro, forward, right, up };
};

// Generate star particles
const starCount = 2000;
const starData = new Float32Array(starCount * 8);

for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const idx = i * 8;
  
  starData[idx] = Math.sin(phi) * Math.cos(theta);
  starData[idx + 1] = Math.sin(phi) * Math.sin(theta);
  starData[idx + 2] = Math.cos(phi);
  starData[idx + 3] = Math.pow(Math.random(), 2.0) * 1.5 + 0.3;
  
  const temp = Math.random();
  if (temp > 0.75) {
    starData[idx + 4] = 1.0; starData[idx + 5] = 0.9; starData[idx + 6] = 0.7;
  } else if (temp < 0.25) {
    starData[idx + 4] = 0.7; starData[idx + 5] = 0.85; starData[idx + 6] = 1.0;
  } else {
    starData[idx + 4] = 1.0; starData[idx + 5] = 1.0; starData[idx + 6] = 1.0;
  }
  
  starData[idx + 7] = Math.random() > 0.95 ? 4.0 : (Math.random() > 0.8 ? 2.5 : 1.5);
}

const stars = ctx.particles(starCount, {
  bufferSize: starCount * 32,
  shader: \`
struct Star { pos: vec3f, brightness: f32, color: vec3f, size: f32 }
@group(1) @binding(0) var<storage, read> particles: array<Star>;

struct VO { @builtin(position) position: vec4f, @location(0) uv: vec2f, @location(1) brightness: f32, @location(2) color: vec3f }

@vertex
fn vs_main(@builtin(instance_index) iid: u32, @builtin(vertex_index) vid: u32) -> VO {
  var out: VO;
  let star = particles[iid];
  let rd = normalize(star.pos);
  
  let time = globals.time;
  let camDist = 75.0 - time * 0.3; let camAngle = time * 0.05;
  let ro = vec3f(sin(camAngle) * 20.0, sin(time * 0.1) * 4.0 + 8.0, camDist);
  let target = vec3f(0.0, 0.0, 30.0);
  let forward = normalize(target - ro);
  let right = normalize(cross(vec3f(0.0, 1.0, 0.0), forward));
  let up = cross(forward, right);
  
  let screenX = dot(rd, right);
  let screenY = dot(rd, up);
  let depth = dot(rd, forward);
  
  if (depth > 0.0) {
    let offset = quadOffset(vid) * star.size * 0.008;
    out.position = vec4f(screenX + offset.x, screenY + offset.y, 0.9, 1.0);
  } else {
    out.position = vec4f(-10.0, -10.0, 0.0, 1.0);
  }
  
  out.uv = quadUV(vid);
  out.brightness = star.brightness;
  out.color = star.color;
  return out;
}

@fragment
fn fs_main(in: VO) -> @location(0) vec4f {
  let d = length(in.uv - 0.5) * 2.0;
  let alpha = 1.0 - smoothstep(0.0, 1.0, d);
  let twinkle = 0.7 + 0.3 * sin(globals.time * 5.0 + in.brightness * 100.0);
  return vec4f(in.color * in.brightness * twinkle * alpha, alpha);
}
\`,
});

stars.write(starData);

// Raymarcher for planet
const alienPlanet = ctx.pass(\`
const MAX_STEPS: i32 = 100;
const MAX_DIST: f32 = 200.0;
const SURF_DIST: f32 = 0.001;
const PLANET_RADIUS: f32 = 8.0;
const PLANET_POS: vec3f = vec3f(0.0, 0.0, 30.0);
const ATMOSPHERE_RADIUS: f32 = 9.5;
const MOON_RADIUS: f32 = 1.5;

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash31(p: vec3f) -> f32 {
  var p3 = fract(p * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

fn hash33(p: vec3f) -> vec3f {
  var p3 = fract(p * vec3f(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

fn noise3D(p: vec3f) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3f(1.0, 0.0, 0.0)), u.x),
    mix(hash31(i + vec3f(0.0, 1.0, 0.0)), hash31(i + vec3f(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash31(i + vec3f(0.0, 0.0, 1.0)), hash31(i + vec3f(1.0, 0.0, 1.0)), u.x),
    mix(hash31(i + vec3f(0.0, 1.0, 1.0)), hash31(i + vec3f(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

fn fbm(p: vec3f) -> f32 {
  var v: f32 = 0.0; var a: f32 = 0.5; var pos = p;
  for (var i = 0; i < 5; i++) { v += a * noise3D(pos); a *= 0.5; pos *= 2.0; }
  return v;
}

fn sdPlanet(p: vec3f) -> f32 {
  let lp = p - PLANET_POS;
  let base = length(lp) - PLANET_RADIUS;
  let noise = fbm(normalize(lp) * 8.0) * 0.3;
  let crater = pow(fbm(normalize(lp) * 4.0 + 10.0), 2.0) * 0.2;
  return base - noise + crater;
}

fn getMoonPos(time: f32) -> vec3f {
  return PLANET_POS + vec3f(cos(time * 0.15) * 16.0, sin(time * 0.1) * 5.0, sin(time * 0.15) * 14.0);
}

fn sdMoon(p: vec3f, time: f32) -> f32 {
  let lp = p - getMoonPos(time);
  return length(lp) - MOON_RADIUS - fbm(normalize(lp) * 6.0) * 0.08;
}

struct Hit { dist: f32, mat: i32 }

fn map(p: vec3f, time: f32) -> Hit {
  var h: Hit; h.dist = MAX_DIST; h.mat = 0;
  let pd = sdPlanet(p); if (pd < h.dist) { h.dist = pd; h.mat = 1; }
  let md = sdMoon(p, time); if (md < h.dist) { h.dist = md; h.mat = 2; }
  return h;
}

fn calcNormal(p: vec3f, time: f32) -> vec3f {
  let e = vec2f(0.001, 0.0);
  return normalize(vec3f(map(p + e.xyy, time).dist - map(p - e.xyy, time).dist,
    map(p + e.yxy, time).dist - map(p - e.yxy, time).dist,
    map(p + e.yyx, time).dist - map(p - e.yyx, time).dist));
}

fn atmosphere(ro: vec3f, rd: vec3f) -> vec3f {
  let oc = ro - PLANET_POS; let b = dot(oc, rd); let c = dot(oc, oc) - ATMOSPHERE_RADIUS * ATMOSPHERE_RADIUS;
  let h = b * b - c; if (h < 0.0) { return vec3f(0.0); }
  let t1 = max(-b - sqrt(h), 0.0); let t2 = -b + sqrt(h); if (t2 < 0.0) { return vec3f(0.0); }
  var scatter = vec3f(0.0); let step = (t2 - t1) / 8.0;
  for (var i = 0; i < 8; i++) {
    let t = t1 + (f32(i) + 0.5) * step;
    let sp = ro + rd * t;
    let alt = (length(sp - PLANET_POS) - PLANET_RADIUS) / (ATMOSPHERE_RADIUS - PLANET_RADIUS);
    let den = exp(-alt * 4.0);
    scatter += (vec3f(0.2, 0.5, 1.0) + vec3f(1.0, 0.4, 0.2) * 0.3) * den * step * 0.15;
  }
  return scatter;
}

fn getPlanetColor(p: vec3f, time: f32) -> vec3f {
  let lp = p - PLANET_POS; let sc = normalize(lp);
  let n1 = fbm(sc * 4.0); let n2 = fbm(sc * 8.0 + 10.0);
  var col = mix(vec3f(0.6, 0.2, 0.4), vec3f(0.2, 0.5, 0.4), n1);
  col = mix(col, vec3f(0.8, 0.6, 0.3), n2 * 0.5);
  let polar = abs(sc.y);
  if (polar > 0.7) { col = mix(col, vec3f(0.7, 0.8, 0.9), smoothstep(0.7, 0.9, polar)); }
  let bio = fbm(sc * 12.0 + time * 0.05);
  if (bio > 0.65) { col += vec3f(0.2, 1.0, 0.6) * (bio - 0.65) * 0.5; }
  return col;
}

@fragment
fn main(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  var uv = (fc.xy - 0.5 * globals.resolution) / globals.resolution.y;
  uv.y = -uv.y;
  let time = globals.time;
  let camDist = 75.0 - time * 0.3; let camAngle = time * 0.05;
  let ro = vec3f(sin(camAngle) * 20.0, sin(time * 0.1) * 4.0 + 8.0, camDist);
  let forward = normalize(PLANET_POS - ro);
  let right = normalize(cross(vec3f(0.0, 1.0, 0.0), forward));
  let up = cross(forward, right);
  let rd = normalize(forward + uv.x * right + uv.y * up);
  let sunDir = normalize(vec3f(0.5, 0.3, -1.0));
  
  // Background with nebula and sun glow (stars rendered separately as particles)
  var col = vec3f(0.0);
  col += pow(max(dot(rd, sunDir), 0.0), 256.0) * 2.0 * vec3f(1.0, 0.9, 0.7);
  col += pow(max(dot(rd, sunDir), 0.0), 8.0) * 0.3 * vec3f(1.0, 0.9, 0.7);
  
  let nc = rd * 2.0;
  let neb1 = fbm(nc + vec3f(0.0, 0.0, time * 0.01));
  let neb2 = fbm(nc * 2.0 + vec3f(100.0, 0.0, time * 0.02));
  col += mix(vec3f(0.1, 0.0, 0.15), vec3f(0.0, 0.1, 0.2), neb1) * neb2 * 0.15;
  
  var t: f32 = 0.0; var hit: Hit; hit.mat = 0;
  for (var i = 0; i < MAX_STEPS; i++) {
    let p = ro + rd * t; let h = map(p, time);
    if (h.dist < SURF_DIST) { hit = h; break; }
    if (t > MAX_DIST) { break; }
    t += h.dist * 0.8;
  }
  
  if (hit.mat > 0) {
    let p = ro + rd * t; let n = calcNormal(p, time);
    var mc = vec3f(0.5);
    if (hit.mat == 1) { mc = getPlanetColor(p, time); }
    else if (hit.mat == 2) { mc = vec3f(0.5, 0.5, 0.55) * fbm(n * 8.0); }
    
    let diff = max(dot(n, sunDir), 0.0);
    let vd = normalize(ro - p);
    let hd = normalize(sunDir + vd);
    let spec = pow(max(dot(n, hd), 0.0), 32.0);
    let fres = pow(1.0 - max(dot(vd, n), 0.0), 4.0);
    
    var sc = vec3f(0.02, 0.03, 0.05) * mc + mc * vec3f(1.0, 0.95, 0.9) * diff + vec3f(1.0, 0.9, 0.8) * spec * 0.3;
    if (hit.mat == 1) { sc += vec3f(0.3, 0.5, 1.0) * fres * 0.5; }
    col = sc;
  } else {
    // Only add atmosphere if we didn't hit the planet/moon
    col += atmosphere(ro, rd);
  }
  
  col = col / (col + vec3f(1.0));
  col = pow(col, vec3f(0.95, 1.0, 1.05));
  col = pow(col, vec3f(1.0 / 2.2));
  col *= 1.0 - 0.3 * length(uv);
  return vec4f(col, 1.0);
}
\`);

function frame() {
  // Draw stars first
  stars.draw();
  // Draw planet on top (autoClear is false after first draw)
  ctx.autoClear = false;
  alienPlanet.draw();
  ctx.autoClear = true;
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'fluid',
    title: 'Fluid Simulation',
    description: 'Real-time Navier-Stokes fluid simulation using ping-pong buffers, vorticity confinement, and pressure projection.',
    executable: true,
    code: `import { gpu } from "ralph-gpu";

const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { dpr: Math.min(devicePixelRatio, 2), autoResize: true });

// Create ping-pong buffers for simulation state
// Velocity and pressure use lower resolution for performance
const SIM = 128, DYE = 256;
const velocity = ctx.pingPong(SIM, SIM, { format: "rg16float", filter: "linear", wrap: "clamp" });
const dye = ctx.pingPong(DYE, DYE, { format: "rgba16float", filter: "linear", wrap: "clamp" });
const pressure = ctx.pingPong(SIM, SIM, { format: "r16float", filter: "linear", wrap: "clamp" });
const divergence = ctx.target(SIM, SIM, { format: "r16float", filter: "nearest", wrap: "clamp" });
const curl = ctx.target(SIM, SIM, { format: "r16float", filter: "nearest", wrap: "clamp" });

// Splat velocity - adds force to the fluid at a point
const splatVelU = { uTarget: { value: velocity.read }, uPoint: { value: [0.5, 0.5] }, uColor: { value: [0, 0, 0] }, uRadius: { value: 0.003 } };
const splatVel = ctx.pass(\`
  @group(1) @binding(0) var uTarget: texture_2d<f32>;
  @group(1) @binding(1) var uTargetSampler: sampler;
  struct Params { point: vec2f, color: vec3f, radius: f32 }
  @group(1) @binding(2) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let base = textureSample(uTarget, uTargetSampler, uv).xy;
    var d = uv - params.point; d.x *= globals.aspect;
    return vec4f(base + exp(-dot(d, d) / params.radius) * params.color.xy, 0.0, 1.0);
  }\`, { uniforms: splatVelU });

// Splat dye - adds color to the fluid at a point
const splatDyeU = { uTarget: { value: dye.read }, uPoint: { value: [0.5, 0.5] }, uColor: { value: [1, 0, 0] }, uRadius: { value: 0.003 } };
const splatDye = ctx.pass(\`
  @group(1) @binding(0) var uTarget: texture_2d<f32>;
  @group(1) @binding(1) var uTargetSampler: sampler;
  struct Params { point: vec2f, color: vec3f, radius: f32 }
  @group(1) @binding(2) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let base = textureSample(uTarget, uTargetSampler, uv).rgb;
    var d = uv - params.point; d.x *= globals.aspect;
    return vec4f(base + exp(-dot(d, d) / params.radius) * params.color, 1.0);
  }\`, { uniforms: splatDyeU });

// Compute curl (rotation) of velocity field
const curlU = { uVelocity: { value: velocity.read } };
const curlPass = ctx.pass(\`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uVelocity, uVelocitySampler, uv - vec2f(e.x, 0)).y;
    let R = textureSample(uVelocity, uVelocitySampler, uv + vec2f(e.x, 0)).y;
    let B = textureSample(uVelocity, uVelocitySampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uVelocity, uVelocitySampler, uv + vec2f(0, e.y)).x;
    return vec4f(0.5 * (R - L - T + B), 0, 0, 1);
  }\`, { uniforms: curlU });

// Vorticity confinement - amplifies rotational motion for more turbulent flow
const vortU = { uVelocity: { value: velocity.read }, uCurl: { value: curl }, uCurlStrength: { value: 20.0 }, uDt: { value: 0.016 } };
const vortPass = ctx.pass(\`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @group(1) @binding(2) var uCurl: texture_2d<f32>;
  @group(1) @binding(3) var uCurlSampler: sampler;
  struct Params { curlStrength: f32, dt: f32 }
  @group(1) @binding(4) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uCurl, uCurlSampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uCurl, uCurlSampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uCurl, uCurlSampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uCurl, uCurlSampler, uv + vec2f(0, e.y)).x;
    let C = textureSample(uCurl, uCurlSampler, uv).x;
    var f = 0.5 * vec2f(abs(T) - abs(B), abs(R) - abs(L));
    f = f / (length(f) + 0.0001) * params.curlStrength * C; f.y = -f.y;
    return vec4f(textureSample(uVelocity, uVelocitySampler, uv).xy + f * params.dt, 0, 1);
  }\`, { uniforms: vortU });

// Compute divergence - measures how much fluid is expanding/contracting
const divU = { uVelocity: { value: velocity.read } };
const divPass = ctx.pass(\`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uVelocity, uVelocitySampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uVelocity, uVelocitySampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uVelocity, uVelocitySampler, uv - vec2f(0, e.y)).y;
    let T = textureSample(uVelocity, uVelocitySampler, uv + vec2f(0, e.y)).y;
    return vec4f(0.5 * (R - L + T - B), 0, 0, 1);
  }\`, { uniforms: divU });

// Pressure solve - iterative solver to remove divergence (make fluid incompressible)
const pressU = { uPressure: { value: pressure.read }, uDivergence: { value: divergence } };
const pressPass = ctx.pass(\`
  @group(1) @binding(0) var uPressure: texture_2d<f32>;
  @group(1) @binding(1) var uPressureSampler: sampler;
  @group(1) @binding(2) var uDivergence: texture_2d<f32>;
  @group(1) @binding(3) var uDivergenceSampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uPressure, uPressureSampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uPressure, uPressureSampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uPressure, uPressureSampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uPressure, uPressureSampler, uv + vec2f(0, e.y)).x;
    let d = textureSample(uDivergence, uDivergenceSampler, uv).x;
    return vec4f((L + R + B + T - d) * 0.25, 0, 0, 1);
  }\`, { uniforms: pressU });

// Gradient subtract - subtract pressure gradient from velocity to enforce incompressibility
const gradU = { uPressure: { value: pressure.read }, uVelocity: { value: velocity.read } };
const gradPass = ctx.pass(\`
  @group(1) @binding(0) var uPressure: texture_2d<f32>;
  @group(1) @binding(1) var uPressureSampler: sampler;
  @group(1) @binding(2) var uVelocity: texture_2d<f32>;
  @group(1) @binding(3) var uVelocitySampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let L = textureSample(uPressure, uPressureSampler, uv - vec2f(e.x, 0)).x;
    let R = textureSample(uPressure, uPressureSampler, uv + vec2f(e.x, 0)).x;
    let B = textureSample(uPressure, uPressureSampler, uv - vec2f(0, e.y)).x;
    let T = textureSample(uPressure, uPressureSampler, uv + vec2f(0, e.y)).x;
    return vec4f(textureSample(uVelocity, uVelocitySampler, uv).xy - vec2f(R - L, T - B), 0, 1);
  }\`, { uniforms: gradU });

// Advect velocity - move velocity field along itself (self-advection)
const advVelU = { uVelocity: { value: velocity.read }, uSource: { value: velocity.read }, uDissipation: { value: 0.99 }, uDt: { value: 0.016 } };
const advVelPass = ctx.pass(\`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @group(1) @binding(2) var uSource: texture_2d<f32>;
  @group(1) @binding(3) var uSourceSampler: sampler;
  struct Params { dissipation: f32, dt: f32 }
  @group(1) @binding(4) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let e = 1.0 / globals.resolution; let uv = pos.xy / globals.resolution;
    let v = textureSample(uVelocity, uVelocitySampler, uv).xy;
    return vec4f(textureSample(uSource, uSourceSampler, uv - params.dt * v * e).xy * params.dissipation, 0, 1);
  }\`, { uniforms: advVelU });

// Advect dye - move color along velocity field
const advDyeU = { uVelocity: { value: velocity.read }, uSource: { value: dye.read }, uDissipation: { value: 0.98 }, uDt: { value: 0.016 } };
const advDyePass = ctx.pass(\`
  @group(1) @binding(0) var uVelocity: texture_2d<f32>;
  @group(1) @binding(1) var uVelocitySampler: sampler;
  @group(1) @binding(2) var uSource: texture_2d<f32>;
  @group(1) @binding(3) var uSourceSampler: sampler;
  struct Params { dissipation: f32, dt: f32 }
  @group(1) @binding(4) var<uniform> params: Params;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let velE = 1.0 / vec2f(128.0, 128.0);
    let uv = pos.xy / globals.resolution;
    let v = textureSample(uVelocity, uVelocitySampler, uv).xy;
    return vec4f(textureSample(uSource, uSourceSampler, uv - params.dt * v * velE).rgb * params.dissipation, 1);
  }\`, { uniforms: advDyeU });

// Display - render dye with tone mapping
const dispU = { uDye: { value: dye.read } };
const dispPass = ctx.pass(\`
  @group(1) @binding(0) var uDye: texture_2d<f32>;
  @group(1) @binding(1) var uDyeSampler: sampler;
  @fragment fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let c = textureSample(uDye, uDyeSampler, pos.xy / globals.resolution).rgb;
    return vec4f(pow(c / (1.0 + c), vec3f(0.45)), 1);
  }\`, { uniforms: dispU });

// HSL to RGB color conversion
function hsl(h, s, l) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const hue = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [hue(h + 1/3), hue(h), hue(h - 1/3)];
}

// Animation loop
let lastX = 0.5, lastY = 0.5;
function frame() {
  const t = ctx.time;
  const dt = 0.016;
  
  // Animated input point
  const x = 0.5 + 0.3 * Math.sin(t);
  const y = 0.5 + 0.2 * Math.cos(t * 4);
  const dx = (x - lastX) * 6000;
  const dy = (y - lastY) * 6000;
  const col = hsl((t * 0.1) % 1, 1, 0.5);
  
  // 1. Splat velocity and dye at input point
  splatVelU.uTarget.value = velocity.read;
  splatVelU.uPoint.value = [x, y];
  splatVelU.uColor.value = [dx, dy, 0];
  ctx.setTarget(velocity.write);
  ctx.autoClear = false;
  splatVel.draw();
  velocity.swap();
  
  splatDyeU.uTarget.value = dye.read;
  splatDyeU.uPoint.value = [x, y];
  splatDyeU.uColor.value = col;
  ctx.setTarget(dye.write);
  splatDye.draw();
  dye.swap();
  
  // 2. Compute curl and apply vorticity confinement
  curlU.uVelocity.value = velocity.read;
  ctx.setTarget(curl);
  curlPass.draw();
  
  vortU.uVelocity.value = velocity.read;
  vortU.uCurl.value = curl;
  vortU.uDt.value = dt;
  ctx.setTarget(velocity.write);
  vortPass.draw();
  velocity.swap();
  
  // 3. Compute divergence and solve for pressure
  divU.uVelocity.value = velocity.read;
  ctx.setTarget(divergence);
  divPass.draw();
  
  // Jacobi iterations for pressure
  for (let i = 0; i < 3; i++) {
    pressU.uPressure.value = pressure.read;
    pressU.uDivergence.value = divergence;
    ctx.setTarget(pressure.write);
    pressPass.draw();
    pressure.swap();
  }
  
  // 4. Subtract pressure gradient to make velocity divergence-free
  gradU.uPressure.value = pressure.read;
  gradU.uVelocity.value = velocity.read;
  ctx.setTarget(velocity.write);
  gradPass.draw();
  velocity.swap();
  
  // 5. Advect velocity and dye along velocity field
  advVelU.uVelocity.value = velocity.read;
  advVelU.uSource.value = velocity.read;
  advVelU.uDt.value = dt;
  ctx.setTarget(velocity.write);
  advVelPass.draw();
  velocity.swap();
  
  advDyeU.uVelocity.value = velocity.read;
  advDyeU.uSource.value = dye.read;
  advDyeU.uDt.value = dt;
  ctx.setTarget(dye.write);
  advDyePass.draw();
  dye.swap();
  
  // 6. Render dye to screen
  dispU.uDye.value = dye.read;
  ctx.setTarget(null);
  ctx.autoClear = true;
  dispPass.draw();
  
  lastX = x;
  lastY = y;
  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
  {
    slug: 'triangle-particles',
    title: 'Triangle Particles',
    description: 'GPU-driven particle system with SDF-based physics. 30,000 particles spawn on triangle edges and flow along a signed distance field with chromatic aberration postprocessing.',
    executable: true,
    code: `import { gpu } from "ralph-gpu";

const canvas = document.getElementById('canvas');
const ctx = await gpu.init(canvas, { autoResize: true, dpr: 2 });

// ============================================================================
// Constants
// ============================================================================

const NUM_PARTICLES = 30000;
const MAX_LIFETIME = 8;
const TRIANGLE_RADIUS = 2;
const VELOCITY_SCALE = 0.04;
const POSITION_JITTER = 0.03;
const INITIAL_VELOCITY_JITTER = 0.4;
const SDF_EPSILON = 0.01;
const FORCE_STRENGTH = 0.13;
const VELOCITY_DAMPING = 0.995;
const RESPAWN_VELOCITY_JITTER = INITIAL_VELOCITY_JITTER;
const SDF_UPDATE_INTERVAL = 0.6;
const SHOOT_LINE_WIDTH = 0.3;
const POINT_SIZE = 0.3;
const FADE_IN_DURATION = MAX_LIFETIME * 0.1;
const FADE_DURATION = MAX_LIFETIME * 1.4;
const PARTICLE_OFFSET_Y = -0.95;
const CHROMATIC_MAX_OFFSET = 0.02;
const CHROMATIC_ANGLE = -23;

// ============================================================================
// Shared WGSL Code
// ============================================================================

const SDF_FUNCTIONS_WGSL = /* wgsl */ \`
  fn hash(seed: f32) -> f32 {
    let s = fract(seed * 0.1031);
    let s2 = s * (s + 33.33);
    return fract(s2 * (s2 + s2));
  }

  fn noise3d(p: vec3f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i.x + i.y * 57.0 + i.z * 113.0),
          hash(i.x + 1.0 + i.y * 57.0 + i.z * 113.0), u.x),
      mix(hash(i.x + (i.y + 1.0) * 57.0 + i.z * 113.0),
          hash(i.x + 1.0 + (i.y + 1.0) * 57.0 + i.z * 113.0), u.x),
      u.y
    );
  }

  fn triangleSdf(p: vec2f, r: f32) -> f32 {
    let k = sqrt(3.0);
    var px = abs(p.x) - r;
    var py = p.y + r / k;
    if (px + k * py > 0.0) {
      let newPx = (px - k * py) / 2.0;
      let newPy = (-k * px - py) / 2.0;
      px = newPx;
      py = newPy;
    }
    px -= clamp(px, -2.0 * r, 0.0);
    let len = sqrt(px * px + py * py);
    return -len * sign(py);
  }

  fn animatedSdf(p: vec2f, r: f32, time: f32) -> f32 {
    let sdf = triangleSdf(p, r + 0.7) - 0.1;
    let noiseSampleScale = 1.;
    let noisePos = vec3f(p.x * noiseSampleScale, p.y * noiseSampleScale - time * 0.1, sin(time * 1.) * 0.5 + .5);
    let noiseSample = noise3d(noisePos) * 2.;
    var noiseScale = step(sdf, 0.) * (1. - u.focused);
    noiseScale = noiseScale * pow(clamp(1. - sdf * 0.1 - 0.2, 0., 1.), 0.5);
    return sdf;
  }
\`;

const BLUR_CALCULATION_WGSL = /* wgsl */ \`
  fn calculateBlurSize(uv: vec2f, maxBlurSize: f32, angleRadians: f32) -> f32 {
    let centered = uv - 0.5;
    let cosA = cos(angleRadians);
    let sinA = sin(angleRadians);
    let rotatedX = centered.x * cosA - centered.y * sinA;
    let blurFactor = clamp(abs(rotatedX) * 2.0, 0.0, 1.0);
    return blurFactor * maxBlurSize;
  }
  
  fn getBlurNormalized(uv: vec2f, maxBlurSize: f32, angleRadians: f32) -> f32 {
    let blurSize = calculateBlurSize(uv, maxBlurSize, angleRadians);
    return blurSize / maxBlurSize;
  }
\`;

// ============================================================================
// Helper: Random point on triangle edge
// ============================================================================

function randomPointOnTriangleEdge(radius) {
  const edge = Math.floor(Math.random() * 3);
  const t = Math.random();
  const k = Math.sqrt(3.0);
  const vertices = [
    [0, (2 * radius) / k],
    [-radius, -radius / k],
    [radius, -radius / k],
  ];
  const v1 = vertices[edge];
  const v2 = vertices[(edge + 1) % 3];
  return [v1[0] + (v2[0] - v1[0]) * t, v1[1] + (v2[1] - v1[1]) * t];
}

// ============================================================================
// Mouse tracking
// ============================================================================

let mousePosition = { x: 0, y: 0 };
let mouseForce = 0.5;
let mouseRadius = 1.0;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const normalizedX = (e.clientX - rect.left) / rect.width;
  const normalizedY = (e.clientY - rect.top) / rect.height;
  const clipX = normalizedX * 2 - 1;
  const clipY = -(normalizedY * 2 - 1);
  const aspect = rect.width / rect.height;
  mousePosition.x = clipX * aspect * 5;
  mousePosition.y = clipY * 5 - PARTICLE_OFFSET_Y;
});

// ============================================================================
// Initialize particle data
// ============================================================================

const positionArray = new Float32Array(NUM_PARTICLES * 2);
const originalPositionArray = new Float32Array(NUM_PARTICLES * 2);
const velocityArrayA = new Float32Array(NUM_PARTICLES * 2);
const velocityArrayB = new Float32Array(NUM_PARTICLES * 2);
const lifetimeArray = new Float32Array(NUM_PARTICLES);

for (let i = 0; i < NUM_PARTICLES; i++) {
  const [x, y] = randomPointOnTriangleEdge(TRIANGLE_RADIUS * 1.2);
  const offsetX = (Math.random() - 0.5) * POSITION_JITTER;
  const offsetY = (Math.random() - 0.5) * POSITION_JITTER;
  
  positionArray[i * 2] = x + offsetX;
  positionArray[i * 2 + 1] = y + offsetY;
  originalPositionArray[i * 2] = x + offsetX;
  originalPositionArray[i * 2 + 1] = y + offsetY;
  lifetimeArray[i] = Math.random() * MAX_LIFETIME;
  velocityArrayA[i * 2] = (Math.random() - 0.5) * INITIAL_VELOCITY_JITTER;
  velocityArrayA[i * 2 + 1] = (Math.random() - 0.5) * INITIAL_VELOCITY_JITTER;
  velocityArrayB[i * 2] = velocityArrayA[i * 2];
  velocityArrayB[i * 2 + 1] = velocityArrayA[i * 2 + 1];
}

// Create storage buffers
const positionBuffer = ctx.storage(NUM_PARTICLES * 2 * 4);
const originalPositionBuffer = ctx.storage(NUM_PARTICLES * 2 * 4);
const velocityBufferA = ctx.storage(NUM_PARTICLES * 2 * 4);
const velocityBufferB = ctx.storage(NUM_PARTICLES * 2 * 4);
const lifetimeBuffer = ctx.storage(NUM_PARTICLES * 4);

positionBuffer.write(positionArray);
originalPositionBuffer.write(originalPositionArray);
velocityBufferA.write(velocityArrayA);
velocityBufferB.write(velocityArrayB);
lifetimeBuffer.write(lifetimeArray);

// ============================================================================
// Create SDF and gradient targets
// ============================================================================

const sdfTarget = ctx.target(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), { format: "r16float" });
const gradientTarget = ctx.target(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), { format: "rg16float" });

// Create samplers
const sdfNearestSampler = ctx.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
const gradientSampler = ctx.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });
const blurSampler = ctx.createSampler({ magFilter: "nearest", minFilter: "nearest", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge" });

// ============================================================================
// Compute shader
// ============================================================================

const computeShaderCode = /* wgsl */ \`
  struct ComputeUniforms {
    deltaTime: f32,
    time: f32,
    focused: f32,
    triangleRadius: f32,
    forceStrength: f32,
    velocityDamping: f32,
    velocityScale: f32,
    maxLifetime: f32,
    offsetY: f32,
    mouseX: f32,
    mouseY: f32,
    mouseDirX: f32,
    mouseDirY: f32,
    mouseForce: f32,
    mouseRadius: f32,
  }
  @group(1) @binding(0) var<uniform> u: ComputeUniforms;
  @group(1) @binding(1) var gradientTexture: texture_2d<f32>;
  @group(1) @binding(2) var gradientSampler: sampler;
  @group(1) @binding(3) var<storage, read_write> positions: array<vec2f>;
  @group(1) @binding(4) var<storage, read> originalPositions: array<vec2f>;
  @group(1) @binding(5) var<storage, read> velocityRead: array<vec2f>;
  @group(1) @binding(6) var<storage, read_write> velocityWrite: array<vec2f>;
  @group(1) @binding(7) var<storage, read_write> lifetimes: array<f32>;

  fn hash(seed: f32) -> f32 {
    let s = fract(seed * 0.1031);
    let s2 = s * (s + 33.33);
    return fract(s2 * (s2 + s2));
  }

  fn randomSigned(seed: f32) -> f32 {
    return hash(seed) * 2.0 - 1.0;
  }

  fn worldToUV(worldPos: vec2f) -> vec2f {
    let ndc = worldPos / vec2f(globals.aspect * 5.0, 5.0);
    let uv = ndc * vec2f(0.5, -0.5) + 0.5;
    return uv;
  }

  fn sampleGradient(worldPos: vec2f) -> vec3f {
    let adjustedPos = worldPos + vec2f(0.0, u.offsetY);
    let uv = worldToUV(adjustedPos);
    let sample = textureSampleLevel(gradientTexture, gradientSampler, uv, 0.0);
    let sdfSign = sign(sample.b - 0.5);
    return vec3f(sample.r, sample.g, sdfSign);
  }

  @compute @workgroup_size(64, 1, 1)
  fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= arrayLength(&positions)) { return; }
    
    var pos = positions[index];
    var vel = velocityRead[index];
    var life = lifetimes[index];

    let gradientData = sampleGradient(pos);
    let gradient = vec2f(gradientData.x, gradientData.y);
    let sdfSign = gradientData.z;

    let force = gradient * u.forceStrength * sdfSign;
    vel *= u.velocityDamping;
    vel += force;

    let mousePos = vec2f(u.mouseX, u.mouseY);
    let mouseDir = vec2f(u.mouseDirX, u.mouseDirY);
    let toMouse = mousePos - pos;
    let distToMouse = length(toMouse);
    
    if (distToMouse < u.mouseRadius && distToMouse > 0.01) {
      let falloff = 1.0 - (distToMouse / u.mouseRadius);
      let pushForce = mouseDir * u.mouseForce * falloff * falloff;
      vel += pushForce;
    }

    pos += vel * u.deltaTime * u.velocityScale;
    life += u.deltaTime;

    if (life > u.maxLifetime) {
      pos = originalPositions[index];
      let seedX = f32(index) + u.time * 1000.0;
      let seedY = f32(index) + u.time * 1000.0 + 12345.0;
      vel = vec2f(
        randomSigned(seedX) * \${RESPAWN_VELOCITY_JITTER},
        randomSigned(seedY) * \${RESPAWN_VELOCITY_JITTER}
      );
      life = 0.0;
    }

    positions[index] = pos;
    velocityWrite[index] = vel;
    lifetimes[index] = life;
  }
\`;

const computeUniforms = {
  deltaTime: { value: 0.016 },
  time: { value: 0.0 },
  focused: { value: 0.0 },
  triangleRadius: { value: TRIANGLE_RADIUS },
  forceStrength: { value: FORCE_STRENGTH },
  velocityDamping: { value: VELOCITY_DAMPING },
  velocityScale: { value: VELOCITY_SCALE },
  maxLifetime: { value: MAX_LIFETIME },
  offsetY: { value: PARTICLE_OFFSET_Y },
  mouseX: { value: 0.0 },
  mouseY: { value: 0.0 },
  mouseDirX: { value: 0.0 },
  mouseDirY: { value: 0.0 },
  mouseForce: { value: 0.5 },
  mouseRadius: { value: 1.0 },
  gradientTexture: { value: gradientTarget.texture },
  gradientSampler: { value: gradientSampler },
};

const computeAtoB = ctx.compute(computeShaderCode, { uniforms: { ...computeUniforms } });
computeAtoB.storage("positions", positionBuffer);
computeAtoB.storage("originalPositions", originalPositionBuffer);
computeAtoB.storage("velocityRead", velocityBufferA);
computeAtoB.storage("velocityWrite", velocityBufferB);
computeAtoB.storage("lifetimes", lifetimeBuffer);

const computeBtoA = ctx.compute(computeShaderCode, { uniforms: { ...computeUniforms } });
computeBtoA.storage("positions", positionBuffer);
computeBtoA.storage("originalPositions", originalPositionBuffer);
computeBtoA.storage("velocityRead", velocityBufferB);
computeBtoA.storage("velocityWrite", velocityBufferA);
computeBtoA.storage("lifetimes", lifetimeBuffer);

// ============================================================================
// Particle rendering material
// ============================================================================

const particleShaderCode = /* wgsl */ \`
  struct RenderUniforms {
    offsetY: f32,
    pointSize: f32,
    fadeInEnd: f32,
    fadeStart: f32,
    fadeEnd: f32,
    triangleRadius: f32,
    bumpIntensity: f32,
    bumpProgress: f32,
    maxBlurSize: f32,
    blurAngle: f32,
    postprocessingEnabled: f32,
    particleColor: vec3f,
  }
  @group(1) @binding(0) var<uniform> u: RenderUniforms;
  @group(1) @binding(1) var<storage, read> positions: array<vec2f>;
  @group(1) @binding(2) var<storage, read> lifetimes: array<f32>;

  struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
    @location(1) @interpolate(flat) life: f32,
    @location(2) @interpolate(flat) sdfDist: f32,
  }

  \${BLUR_CALCULATION_WGSL}

  fn triangleSdf(p: vec2f, r: f32) -> f32 {
    let k = sqrt(3.0);
    var px = abs(p.x) - r;
    var py = p.y + r / k;
    if (px + k * py > 0.0) {
      let newPx = (px - k * py) / 2.0;
      let newPy = (-k * px - py) / 2.0;
      px = newPx;
      py = newPy;
    }
    px -= clamp(px, -2.0 * r, 0.0);
    let len = sqrt(px * px + py * py);
    return -len * sign(py) - 0.7;
  }

  @vertex
  fn vs_main(
    @builtin(vertex_index) vid: u32,
    @builtin(instance_index) iid: u32
  ) -> VertexOutput {
    let pos2d = positions[iid];
    let life = lifetimes[iid];
    let sdf = triangleSdf(pos2d, u.triangleRadius);

    var quad = array<vec2f, 6>(
      vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
      vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1),
    );

    let quadPos = quad[vid];
    let aspect = globals.aspect;
    let worldPos = pos2d + vec2f(0.0, u.offsetY);
    let clipPos = worldPos / vec2f(aspect * 5.0, 5.0);
    let screenUV = clipPos * vec2f(0.5, -0.5) + 0.5;
    let blurFactor = getBlurNormalized(screenUV, u.maxBlurSize, u.blurAngle);
    let sizeMultiplier = select(1.0, 1.0 + blurFactor, u.postprocessingEnabled > 0.5);
    let particleSize = u.pointSize * 0.01 * sizeMultiplier;
    let localPos = quadPos * vec2f(particleSize / aspect, particleSize);
    let finalClipPos = clipPos + localPos;

    var out: VertexOutput;
    out.pos = vec4f(finalClipPos, 0.0, 1.0);
    out.uv = quadPos * 0.5 + 0.5;
    out.life = life;
    out.sdfDist = abs(sdf);
    return out;
  }

  @fragment
  fn fs_main(in: VertexOutput) -> @location(0) vec4f {
    let d = length(in.uv - 0.5);
    if (d > 0.5) { discard; }
    
    let edgeSoftness = smoothstep(0.5, 0.3, d);
    let fadeIn = smoothstep(0.0, u.fadeInEnd, in.life);
    let fadeOut = 1.0 - smoothstep(u.fadeStart, u.fadeEnd, in.life);
    let lifetimeOpacity = fadeIn * fadeOut;
    let bumpDist = abs(in.sdfDist - u.bumpProgress);
    let bumpEffect = smoothstep(0.7, 0.0, bumpDist) * u.bumpIntensity;
    let baseOpacity = 0.4;
    let finalOpacity = mix(baseOpacity, 1.0, bumpEffect);
    let alpha = lifetimeOpacity * finalOpacity * edgeSoftness;
    return vec4f(u.particleColor, alpha);
  }
\`;

const renderUniforms = {
  offsetY: { value: PARTICLE_OFFSET_Y },
  pointSize: { value: POINT_SIZE },
  fadeInEnd: { value: FADE_IN_DURATION },
  fadeStart: { value: MAX_LIFETIME - FADE_DURATION },
  fadeEnd: { value: MAX_LIFETIME },
  triangleRadius: { value: TRIANGLE_RADIUS },
  bumpIntensity: { value: 0.0 },
  bumpProgress: { value: 0.0 },
  maxBlurSize: { value: CHROMATIC_MAX_OFFSET },
  blurAngle: { value: (CHROMATIC_ANGLE * Math.PI) / 180 },
  postprocessingEnabled: { value: 1.0 },
  particleColor: { value: [1.0, 1.0, 1.0] },
};

const particleMaterial = ctx.material(particleShaderCode, {
  vertexCount: 6,
  instances: NUM_PARTICLES,
  blend: "additive",
  uniforms: renderUniforms,
});
particleMaterial.storage("positions", positionBuffer);
particleMaterial.storage("lifetimes", lifetimeBuffer);

// ============================================================================
// SDF pass
// ============================================================================

const sdfUniforms = {
  time: { value: 0.0 },
  triangleRadius: { value: TRIANGLE_RADIUS },
  focused: { value: 0.0 },
  offsetY: { value: PARTICLE_OFFSET_Y },
};

const sdfPass = ctx.pass(\`
  struct SdfUniforms { time: f32, triangleRadius: f32, focused: f32, offsetY: f32 }
  @group(1) @binding(0) var<uniform> u: SdfUniforms;

  \${SDF_FUNCTIONS_WGSL}

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let centered = uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
    let worldPos = centered * vec2f(globals.aspect * 5.0, 5.0) - vec2f(0.0, u.offsetY);
    let sdf = animatedSdf(worldPos, u.triangleRadius, u.time);
    return vec4f(sdf, 0.0, 0.0, 1.0);
  }
\`, { uniforms: sdfUniforms });

// ============================================================================
// Gradient pass
// ============================================================================

const gradientUniforms = {
  sdfEpsilon: { value: SDF_EPSILON },
  triangleRadius: { value: TRIANGLE_RADIUS },
  shootLineStrength: { value: 1.0 },
  shootLineWidth: { value: SHOOT_LINE_WIDTH },
  offsetY: { value: PARTICLE_OFFSET_Y },
  sdfTexture: { value: sdfTarget.texture },
  sdfSampler: { value: sdfNearestSampler },
};

const gradientPass = ctx.pass(\`
  struct GradientUniforms {
    sdfEpsilon: f32,
    triangleRadius: f32,
    shootLineStrength: f32,
    shootLineWidth: f32,
    offsetY: f32,
  }
  @group(1) @binding(0) var<uniform> u: GradientUniforms;
  @group(1) @binding(1) var sdfTexture: texture_2d<f32>;
  @group(1) @binding(2) var sdfSampler: sampler;

  fn distToLineSegment(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * t);
  }

  fn projectOnLine(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let pa = p - a;
    let ba = b - a;
    return dot(pa, ba) / dot(ba, ba);
  }

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let texSize = vec2f(textureDimensions(sdfTexture));
    let pixelSize = 1.0 / texSize;
    let uv = pos.xy / globals.resolution;
    let centered = uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0);
    let worldPos = centered * vec2f(globals.aspect * 5.0, 5.0) - vec2f(0.0, u.offsetY);
    
    let sdfCenter = textureSample(sdfTexture, sdfSampler, uv).r;
    let worldToUvScaleX = 0.5 / (globals.aspect * 5.0);
    let worldToUvScaleY = 0.5 / 5.0;
    let uvEpsilonX = u.sdfEpsilon * worldToUvScaleX;
    let uvEpsilonY = u.sdfEpsilon * worldToUvScaleY;
    
    let sdfRight = textureSample(sdfTexture, sdfSampler, uv + vec2f(uvEpsilonX, 0.0)).r;
    let sdfTop = textureSample(sdfTexture, sdfSampler, uv + vec2f(0.0, -uvEpsilonY)).r;
    
    let sdfSign = sign(sdfCenter);
    var gradX = (sdfRight - sdfCenter) / u.sdfEpsilon;
    gradX *= -sdfSign;
    var gradY = (sdfTop - sdfCenter) / u.sdfEpsilon;
    gradY *= -sdfSign;
    
    let k = sqrt(3.0);
    let r = u.triangleRadius + 0.7;
    let triangleCenter = vec2f(0.0, 0.0);
    let bottomRightVertex = vec2f(r, -r / k);
    let toVertex = normalize(bottomRightVertex - triangleCenter);
    let lineStart = triangleCenter - toVertex * 20.0;
    let lineEnd = triangleCenter + toVertex * 20.0;
    let distToLine = distToLineSegment(worldPos, lineStart, lineEnd);
    let t = projectOnLine(worldPos, triangleCenter, lineEnd);
    let shootDir = -select(-toVertex, toVertex, t > 0.12);
    let lineInfluence = smoothstep(u.shootLineWidth, 0.0, distToLine) * u.shootLineStrength;
    
    gradX = mix(gradX, shootDir.x * 3.0, lineInfluence);
    gradY = mix(gradY, shootDir.y * 3.0, lineInfluence);
    
    var sdfSignEncoded = 0.5 + 0.5 * sign(sdfCenter);
    sdfSignEncoded = mix(sdfSignEncoded, 1.0, lineInfluence);
    
    return vec4f(gradX, gradY, sdfSignEncoded, 1.0);
  }
\`, { uniforms: gradientUniforms });

// ============================================================================
// Postprocessing (chromatic aberration)
// ============================================================================

const renderTarget = ctx.target();

const chromaticUniforms = {
  inputTex: { value: renderTarget.texture },
  inputSampler: { value: blurSampler },
  maxOffset: { value: CHROMATIC_MAX_OFFSET },
  angle: { value: (CHROMATIC_ANGLE * Math.PI) / 180 },
  samples: { value: 8 },
  useZoom: { value: 0.0 },
};

const blurPass = ctx.pass(\`
  struct ChromaticUniforms { maxOffset: f32, angle: f32, samples: f32, useZoom: f32 }
  @group(1) @binding(0) var<uniform> u: ChromaticUniforms;
  @group(1) @binding(1) var inputTex: texture_2d<f32>;
  @group(1) @binding(2) var inputSampler: sampler;

  \${BLUR_CALCULATION_WGSL}

  @fragment
  fn main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / globals.resolution;
    let chromaticOffset = calculateBlurSize(uv, u.maxOffset, u.angle);
    let center = vec2f(0.5, 0.5);
    let fromCenter = uv - center;
    let fromCenterCorrected = vec2f(fromCenter.x * globals.aspect, fromCenter.y);
    let distFromCenter = length(fromCenterCorrected);
    let radialCorrected = select(vec2f(0.0, 1.0), fromCenterCorrected / distFromCenter, distFromCenter > 0.001);
    let tangentCorrected = vec2f(-radialCorrected.y, radialCorrected.x);
    let dirCorrected = select(tangentCorrected, radialCorrected, u.useZoom > 0.5);
    let sampleDir = vec2f(dirCorrected.x / globals.aspect, dirCorrected.y);
    
    let sampleCount = i32(u.samples);
    var r = 0.0;
    var g = 0.0;
    var b = 0.0;
    
    for (var i = 0; i < sampleCount; i++) {
      let t = (f32(i) + 0.5) / u.samples * 2.0 - 1.0;
      let sampleOffset = sampleDir * chromaticOffset * t;
      let sampleUV = uv + sampleOffset;
      let sampledColor = textureSample(inputTex, inputSampler, sampleUV).rgb;
      let redWeight = smoothstep(-1.0, 1.0, t);
      let blueWeight = smoothstep(1.0, -1.0, t);
      let greenWeight = 1.0 - abs(t);
      r += sampledColor.r * redWeight;
      g += sampledColor.g * greenWeight;
      b += sampledColor.b * blueWeight;
    }
    
    let totalWeight = u.samples * 0.5;
    r /= totalWeight;
    g /= totalWeight;
    b /= totalWeight;
    
    return vec4f(r, g, b, 1.0);
  }
\`, { uniforms: chromaticUniforms });

// ============================================================================
// Animation loop
// ============================================================================

let pingPong = 0;
let lastTime = performance.now();
let totalTime = 0;
let lastSdfUpdateTime = 0;
let needsSdfUpdate = true;

let prevMouseX = 0;
let prevMouseY = 0;
let mouseVelocity = 0;
let mouseDirX = 0;
let mouseDirY = 0;

function frame() {
  const now = performance.now();
  const deltaTime = Math.min((now - lastTime) / 1000, 0.07);
  lastTime = now;
  totalTime += deltaTime;

  // Mouse velocity tracking
  const currentMouseX = mousePosition.x;
  const currentMouseY = mousePosition.y;
  const dx = currentMouseX - prevMouseX;
  const dy = currentMouseY - prevMouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (deltaTime > 0) {
    const speed = dist / deltaTime;
    mouseVelocity = mouseVelocity * 0.8 + speed * 0.2;
    if (dist > 0.001) {
      mouseDirX = mouseDirX * 0.8 + (dx / dist) * 0.2;
      mouseDirY = mouseDirY * 0.8 + (dy / dist) * 0.2;
    } else {
      mouseDirX *= 0.95;
      mouseDirY *= 0.95;
    }
  }
  prevMouseX = currentMouseX;
  prevMouseY = currentMouseY;

  // Update SDF texture periodically
  const timeSinceLastSdfUpdate = totalTime - lastSdfUpdateTime;
  if (needsSdfUpdate || timeSinceLastSdfUpdate >= SDF_UPDATE_INTERVAL) {
    sdfUniforms.time.value = totalTime;
    ctx.setTarget(sdfTarget);
    sdfPass.draw();
    ctx.setTarget(gradientTarget);
    gradientPass.draw();
    lastSdfUpdateTime = totalTime;
    needsSdfUpdate = false;
  }

  // Update compute uniforms
  computeUniforms.deltaTime.value = deltaTime;
  computeUniforms.time.value = totalTime;
  computeUniforms.mouseX.value = currentMouseX;
  computeUniforms.mouseY.value = currentMouseY;
  computeUniforms.mouseDirX.value = mouseDirX;
  computeUniforms.mouseDirY.value = mouseDirY;
  computeUniforms.mouseRadius.value = mouseRadius;
  
  const velocityFactor = Math.min(mouseVelocity / 50, 1);
  computeUniforms.mouseForce.value = mouseForce + velocityFactor * (50.0 - mouseForce);

  // Dispatch compute shader (ping-pong)
  if (pingPong === 0) {
    computeAtoB.dispatch(Math.ceil(NUM_PARTICLES / 64));
  } else {
    computeBtoA.dispatch(Math.ceil(NUM_PARTICLES / 64));
  }
  pingPong = 1 - pingPong;

  // Render particles to target, then apply postprocessing
  ctx.setTarget(renderTarget);
  ctx.autoClear = false;
  ctx.clear(renderTarget, [0, 0, 0, 1]);
  particleMaterial.draw();
  ctx.setTarget(null);
  blurPass.draw();
  ctx.autoClear = true;

  requestAnimationFrame(frame);
}
frame();
`,
    animated: true,
  },
];

export function getExampleBySlug(slug: string): Example | undefined {
  return examples.find((e) => e.slug === slug);
}

export function getAllExamples(): Example[] {
  return examples;
}
