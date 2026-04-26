import { Page, expect } from '@playwright/test';

export async function enableE2EAuth(page: Page, pro = false) {
  await page.addInitScript(({ isPro }) => {
    localStorage.setItem('W3B_E2E_AUTH', 'true');
    localStorage.setItem('W3B_E2E_PRO', String(isPro));
    localStorage.setItem('w3b.persona.value', 'both');
    localStorage.setItem('w3b.persona.developer', 'true');
    localStorage.setItem('w3b.persona.focus', 'player');
  }, { isPro: pro });
}

export async function mockApprovedPayPal(page: Page) {
  await page.route('**/paypal/state/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'approved',
        planUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
  });
}

export async function expectNoVisibleOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      widthOverflow: doc.scrollWidth - doc.clientWidth,
      height: doc.scrollHeight,
      viewportHeight: doc.clientHeight
    };
  });
  expect(overflow.widthOverflow).toBeLessThanOrEqual(2);
}
