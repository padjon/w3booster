import { test, expect } from '@playwright/test';
import { enableE2EAuth, expectNoVisibleOverflow, mockApprovedPayPal } from './helpers';

test.describe('public web surfaces', () => {
  test('landing, developer portal, profile, and login render on desktop and mobile', async ({ page }) => {
    await page.goto('/web');
    await expect(page.getByRole('heading', { name: 'W3Booster' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download Windows client' })).toBeVisible();
    await expectNoVisibleOverflow(page);

    await page.goto('/developers');
    await expect(page.getByRole('heading', { name: 'Build on live Warcraft III state.' })).toBeVisible();
    await expect(page.getByText('Live stream sketch')).toBeVisible();
    await expectNoVisibleOverflow(page);

    await page.goto('/p/E2EStreamer');
    await expect(page.getByRole('heading', { name: 'E2EStreamer' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Gift Pro/i })).toBeVisible();
    await expectNoVisibleOverflow(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login with Twitch' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Twitch/i })).toBeVisible();
    await expectNoVisibleOverflow(page);
  });

  test('gift checkout can drive mocked PayPal approval in E2E mode', async ({ page }) => {
    await enableE2EAuth(page, true);
    await mockApprovedPayPal(page);

    await page.goto('/gift/E2EStreamer');
    await page.getByTestId('gift-paypal').click();

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
    await expect(page.getByText(/Your Pro Plan is now active until/i)).toBeVisible();
  });
});
