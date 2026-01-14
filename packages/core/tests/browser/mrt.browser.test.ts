import { test, expect } from '@playwright/test';

test.describe('MRT (Multiple Render Targets)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/browser/index.html');
  });

  test('should write to multiple targets', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { setupTest, expectPixelNear, teardown } = (window as any).RalphTestUtils;
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
      
      // Pass 1: Draw to MRT (which currently defaults to target 0)
      context.setTarget(mrt);
      passRed.draw();
      
      // Check first target
      const target0 = mrt.get('color0');
      if (!target0) throw new Error('target0 is undefined');
      const data0 = await target0.readPixels(0, 0, 1, 1);
      expectPixelNear(data0, [255, 0, 0, 255], 3);
      
      // Pass 2: Draw directly to target1
      const target1 = mrt.get('color1');
      if (!target1) throw new Error('target1 is undefined');
      context.setTarget(target1);
      passGreen.draw();

      // Check second target
      const data1 = await target1.readPixels(0, 0, 1, 1);
      expectPixelNear(data1, [0, 255, 0, 255], 3);
      
      teardown();
      return true;
    });

    expect(result).toBe(true);
  });
});
