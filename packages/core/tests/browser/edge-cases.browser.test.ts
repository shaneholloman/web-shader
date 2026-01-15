import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('zero vertex count does not crash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { setupTest, waitForFrame, teardown } = (window as any).RalphTestUtils;
      const { context } = await setupTest(32, 32);
      
      try {
        const material = context.material(`
          @vertex fn vs() -> @builtin(position) vec4f { return vec4f(0.0); }
          @fragment fn fs() -> @location(0) vec4f { return vec4f(1.0); }
        `, { vertexCount: 0 });
        material.draw();
        await waitForFrame();
      } catch (e) {
        // May or may not throw - just checking no crash
      }
      
      teardown();
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('empty pass (draw with no visible output)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { setupTest, waitForFrame, teardown } = (window as any).RalphTestUtils;
      const { context } = await setupTest(32, 32);
      
      const pass = context.pass(`
        @fragment fn main() -> @location(0) vec4f {
          return vec4f(0.0);
        }
      `);
      pass.draw();
      
      await waitForFrame();
      teardown();
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('can dispose and create new context', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { gpu } = (window as any).RalphGPU;
      
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      document.body.appendChild(canvas);
      
      // Create first context
      const ctx1 = await gpu.init(canvas);
      ctx1.dispose();
      
      // Create second context on same canvas
      const ctx2 = await gpu.init(canvas);
      
      const pass = ctx2.pass(`
        @fragment fn main() -> @location(0) vec4f {
          return vec4f(1.0, 0.0, 0.0, 1.0);
        }
      `);
      pass.draw();
      
      ctx2.dispose();
      canvas.remove();
      
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('multiple contexts (two canvases)', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { gpu } = (window as any).RalphGPU;
      
      const canvas1 = document.createElement('canvas');
      canvas1.width = 32;
      canvas1.height = 32;
      document.body.appendChild(canvas1);

      const canvas2 = document.createElement('canvas');
      canvas2.width = 32;
      canvas2.height = 32;
      document.body.appendChild(canvas2);
      
      const ctx1 = await gpu.init(canvas1);
      const ctx2 = await gpu.init(canvas2);
      
      const pass1 = ctx1.pass(`
        @fragment fn main() -> @location(0) vec4f {
          return vec4f(1.0, 0.0, 0.0, 1.0);
        }
      `);
      
      const pass2 = ctx2.pass(`
        @fragment fn main() -> @location(0) vec4f {
          return vec4f(0.0, 1.0, 0.0, 1.0);
        }
      `);

      pass1.draw();
      pass2.draw();
      
      ctx1.dispose();
      ctx2.dispose();
      canvas1.remove();
      canvas2.remove();
      
      return { success: true };
    });

    expect(result.success).toBe(true);
  });

  test('rapid create/dispose stress test', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { gpu } = (window as any).RalphGPU;
      
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      document.body.appendChild(canvas);
      
      for (let i = 0; i < 10; i++) {
        const ctx = await gpu.init(canvas);
        const pass = ctx.pass(`
          @fragment fn main() -> @location(0) vec4f {
            return vec4f(1.0, 1.0, 1.0, 1.0);
          }
        `);
        pass.draw();
        ctx.dispose();
      }
      
      canvas.remove();
      return { success: true };
    });

    expect(result.success).toBe(true);
  });
});
