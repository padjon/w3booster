import { Page, expect } from '@playwright/test';

export async function enableE2EAuth(page: Page, pro = false, persona: 'player' | 'streamer' | null = 'player') {
  await page.addInitScript(({ isPro, personaValue }) => {
    localStorage.setItem('W3B_E2E_AUTH', 'true');
    localStorage.setItem('W3B_E2E_PRO', String(isPro));
    if (personaValue) {
      if (!localStorage.getItem('w3b.persona.value')) {
        localStorage.setItem('w3b.persona.value', personaValue);
      }
    } else {
      localStorage.removeItem('w3b.persona.value');
    }
    localStorage.setItem('w3b.persona.developer', 'true');
  }, { isPro: pro, personaValue: persona });
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

export async function mockApprovedStripe(page: Page) {
  await page.route('**/stripe/state/**', async route => {
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
