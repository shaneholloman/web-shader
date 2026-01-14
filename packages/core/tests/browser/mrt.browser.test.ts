import { test, expect } from '@playwright/test';

test.describe('MRT (Multiple Render Targets)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('should write to multiple targets', async ({ page }) => {
    await page.evaluate(async () => {
      const { setupTest, waitForFrame } = (window as any).RalphTestUtils;
      const { context } = await setupTest(8, 8);
      
      const mrt = context.mrt({
        color0: { format: 'rgba8unorm' },
        color1: { format: 'rgba8unorm' }
      }, 8, 8);
      
      const passRed = context.pass(/* wgsl */ `
        @fragment
        fn main() -> @location(0) vec4f {
          return vec4f(1.0, 0.0, 0.0, 1.0);
        }
      `);

      const passGreen = context.pass(/* wgsl */ `
        @fragment
        fn main() -> @location(0) vec4f {
          return vec4f(0.0, 1.0, 0.0, 1.0);
        }
      `);
      
      const target0 = mrt.get('color0');
      const target1 = mrt.get('color1');
      if (!target0 || !target1) throw new Error('mrt targets missing');
      (window as any).__mrtTargets = { target0, target1 };

      // Pass 1: Draw to MRT (which currently defaults to target 0)
      context.setTarget(mrt);
      passRed.draw();
      await waitForFrame();
      
      // Pass 2: Draw directly to target1
      context.setTarget(target1);
      passGreen.draw();
      await waitForFrame();
    });

    await page.screenshot();

    const result = await page.evaluate(async () => {
      const { expectPixelNear, teardown } = (window as any).RalphTestUtils;
      const { target0, target1 } = (window as any).__mrtTargets || {};
      if (!target0 || !target1) throw new Error('mrt targets missing');

      const data0 = await target0.readPixels(0, 0, 1, 1);
      expectPixelNear(data0, [255, 0, 0, 255], 3);

      const data1 = await target1.readPixels(0, 0, 1, 1);
      expectPixelNear(data1, [0, 255, 0, 255], 3);
      
      teardown();
      return true;
    });

    expect(result).toBe(true);
  });
});
