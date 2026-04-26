import { test, expect } from '@playwright/test';
import { enableE2EAuth, expectNoVisibleOverflow } from './helpers';

async function switchPersona(page, persona: 'player' | 'streamer') {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: persona === 'streamer' ? 'Streamer' : 'Player', exact: true }).click();
  await expect(page.getByRole('link', { name: persona === 'streamer' ? /Stream Hub/i : /Practice Hub/i })).toBeVisible();
  await page.evaluate(value => localStorage.setItem('w3b.persona.value', value), persona);
}

test.describe('authenticated dashboard shell', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EAuth(page, true);
  });

  test('first run asks for the main usage and keeps the top persona switch available', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('W3B_E2E_AUTH', 'true');
      localStorage.setItem('W3B_E2E_PRO', 'true');
      localStorage.removeItem('w3b.persona.value');
      localStorage.setItem('w3b.persona.developer', 'true');
    });

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'What is your main usage?' })).toBeVisible();
    await expect(page.getByText(/You can always switch later/i)).toBeVisible();
    await page.getByRole('button', { name: /Streamer/i }).last().click();
    await expect(page.getByRole('heading', { name: 'What is your main usage?' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Player' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Streamer' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Stream Hub/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Practice Hub/i })).toHaveCount(0);
  });

  test('persona shell routes and developer facet are available', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('W3Booster').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Practice Hub/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Stream Hub/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Developers/i })).toBeVisible();
    await expectNoVisibleOverflow(page);

    await page.getByRole('button', { name: 'Streamer' }).click();
    await expect(page.getByRole('link', { name: /Stream Hub/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Practice Hub/i })).toHaveCount(0);
    await page.getByRole('link', { name: /Stream Hub/i }).click();
    await expect(page.getByRole('heading', { name: 'Live production command center' })).toBeVisible();

    await page.getByRole('link', { name: /Developers/i }).click();
    await expect(page.getByRole('heading', { name: 'API console' })).toBeVisible();
  });

  test('build orders can be created, edited, exported, and imported locally', async ({ page }) => {
    await page.goto('/dashboard/build-orders');
    await expect(page.getByRole('heading', { name: 'Training program library' })).toBeVisible();

    await page.getByRole('button', { name: 'New', exact: true }).click();
    await page.getByLabel('Name').fill('E2E Human Drill');
    await page.getByLabel('Matchup').fill('humanvorc');
    await page.getByRole('button', { name: 'Step', exact: true }).click();
    await expect(page.getByText('E2E Human Drill')).toBeVisible();

    const shareCode = await page.locator('textarea[readonly]').inputValue();
    expect(shareCode.length).toBeGreaterThan(40);

    await page.getByPlaceholder('Paste a build order share code').fill(shareCode);
    await page.getByRole('button', { name: /^Import$/ }).click();
    await expect(page.getByText('E2E Human Drill')).toHaveCount(2);
  });

  test('overlay quick preset toggles existing settings', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('w3b.persona.value', 'streamer'));
    await page.goto('/dashboard/overlays');
    await expect(page.getByRole('heading', { name: 'Preset library' })).toBeVisible();
    await expect(page.getByTestId('obs-browser-source-toggle')).toBeVisible();

    const firstMatchupBar = page.getByRole('button', { name: /Matchup bar/i }).first();
    await expect(firstMatchupBar).toBeVisible();
    await firstMatchupBar.click();
    await expect(page.getByText(/OBS browser URL/i)).toBeVisible();
    await expectNoVisibleOverflow(page);
  });

  test('mobile dashboard routes remain scrollable without clipped content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'mobile layout regression coverage');
    await page.setViewportSize({ width: 393, height: 640 });

    const routes = [
      { path: '/dashboard/practice', heading: 'Diagnose, drill, repeat', persona: 'player' },
      { path: '/dashboard/stream', heading: 'Live production command center', persona: 'streamer' },
      { path: '/dashboard/build-orders', heading: 'Training program library', persona: 'player' },
      { path: '/dashboard/account', heading: 'E2E Tester', persona: 'player' }
    ];

    let scrollableRouteCount = 0;

    for (const route of routes) {
      await switchPersona(page, route.persona as 'player' | 'streamer');
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      await expect(page.locator('.dashboard-shell__rail')).toBeVisible();
      await expectNoVisibleOverflow(page);

      const railBox = await page.locator('.dashboard-shell__rail').boundingBox();
      const headingBox = await page.getByRole('heading', { name: route.heading }).boundingBox();
      expect(railBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      expect(railBox!.y + railBox!.height).toBeLessThanOrEqual(headingBox!.y + 2);

      const scrollState = await page.evaluate(() => {
        window.scrollTo(0, 0);
        const before = window.scrollY;
        window.scrollTo(0, document.documentElement.scrollHeight);
        return {
          before,
          after: window.scrollY,
          maxScroll: document.documentElement.scrollHeight - window.innerHeight
        };
      });

      if (scrollState.maxScroll > 0) {
        scrollableRouteCount++;
        expect(scrollState.after).toBeGreaterThan(scrollState.before);
      }
    }

    expect(scrollableRouteCount).toBeGreaterThan(0);
  });

  test('dashboard visual screenshots cover core desktop and mobile routes', async ({ page }, testInfo) => {
    const routes = [
      { path: '/dashboard/practice', name: 'practice', heading: 'Diagnose, drill, repeat', persona: 'player' },
      { path: '/dashboard/stream', name: 'stream', heading: 'Live production command center', persona: 'streamer' },
      { path: '/dashboard/build-orders', name: 'build-orders', heading: 'Training program library', persona: 'player' },
      { path: '/dashboard/account', name: 'account', heading: 'E2E Tester', persona: 'player' }
    ];

    for (const route of routes) {
      await switchPersona(page, route.persona as 'player' | 'streamer');
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      await expectNoVisibleOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`${testInfo.project.name}-${route.name}.png`),
        fullPage: true
      });
    }
  });
});
