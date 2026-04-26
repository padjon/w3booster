import { test, expect } from '@playwright/test';
import { enableE2EAuth, expectNoVisibleOverflow, mockApprovedPayPal, mockApprovedStripe } from './helpers';

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
    await expect(page.getByRole('button', { name: /Continue with Battle\.net/i })).toBeVisible();
    await expectNoVisibleOverflow(page);
  });

  test('landing login starts browser Twitch auth from the rendered page', async ({ page }) => {
    await page.route('https://id.twitch.tv/oauth2/authorize**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<title>Twitch auth intercepted</title><main>Twitch auth intercepted</main>'
      });
    });

    await page.goto('/web');
    await page.getByRole('link', { name: /^Login$/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    const appHost = await page.evaluate(() => location.hostname);

    const twitchButton = page.getByRole('button', { name: /Continue with Twitch/i });
    await expect(twitchButton).toBeEnabled();
    await twitchButton.click();
    await expect(page).toHaveURL(/id\.twitch\.tv\/oauth2\/authorize/);

    const authUrl = new URL(page.url());
    expect(authUrl.searchParams.get('client_id')).toBeTruthy();
    const redirectUri = authUrl.searchParams.get('redirect_uri') || '';
    expect(redirectUri).toContain('/twitch-auth/register');
    expect(redirectUri).not.toContain('app.w3booster.com');
    expect(redirectUri).not.toContain('preview.w3booster.com:15469');
    if (appHost === 'preview.w3booster.com') {
      expect(redirectUri).toBe('https://api.preview.w3booster.com/twitch-auth/register');
    }
    expect(authUrl.searchParams.get('state')).toMatch(/^w3b:/);
  });

  test('landing login can start Battle.net browser auth from the rendered page', async ({ page }) => {
    await page.route('**/battlenet-auth/start**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<title>Battle.net auth intercepted</title><main>Battle.net auth intercepted</main>'
      });
    });

    await page.goto('/web');
    await page.getByRole('link', { name: /^Login$/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    const battleNetButton = page.getByRole('button', { name: /Continue with Battle\.net/i });
    await expect(battleNetButton).toBeEnabled();
    await battleNetButton.click();
    await expect(page).toHaveURL(/battlenet-auth\/start/);

    const authUrl = new URL(page.url());
    expect(authUrl.searchParams.get('state')).toMatch(/^w3b:/);
  });

  test('gift checkout can drive mocked PayPal approval in E2E mode', async ({ page }) => {
    await enableE2EAuth(page, true);
    await mockApprovedPayPal(page);

    await page.goto('/gift/E2EStreamer');
    await page.getByTestId('gift-paypal').click();

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
    await expect(page.getByText(/Your Pro Plan is now active until/i)).toBeVisible();
  });

  test('gift checkout can drive mocked Stripe approval in E2E mode', async ({ page }) => {
    await enableE2EAuth(page, true);
    await mockApprovedStripe(page);

    await page.goto('/gift/E2EStreamer');
    await page.getByTestId('gift-stripe').click();

    await expect(page.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
    await expect(page.getByText(/Your Pro Plan is now active until/i)).toBeVisible();
  });
});
