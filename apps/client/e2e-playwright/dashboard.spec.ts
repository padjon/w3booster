import { test, expect } from '@playwright/test';
import { enableE2EAuth, expectNoVisibleOverflow } from './helpers';

test.describe('authenticated dashboard shell', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EAuth(page, true);
  });

  test('persona shell routes and developer facet are available', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('W3Booster').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Practice Hub/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Stream Hub/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Developers/i })).toBeVisible();
    await expectNoVisibleOverflow(page);

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
    await page.goto('/dashboard/overlays');
    await expect(page.getByRole('heading', { name: 'Preset library' })).toBeVisible();

    const firstMatchupBar = page.getByRole('button', { name: /Matchup bar/i }).first();
    await expect(firstMatchupBar).toBeVisible();
    await firstMatchupBar.click();
    await expect(page.getByText(/OBS browser URL/i)).toBeVisible();
    await expectNoVisibleOverflow(page);
  });
});
