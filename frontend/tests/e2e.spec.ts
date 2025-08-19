import { test, expect } from '@playwright/test';

test('3 players see different narratives', async ({ page, browser }) => {
	// player A - merciful
	await page.goto('/');
	await page.fill('input[placeholder="Your name"]', 'Alice');
	await page.selectOption('select', 'merciful');
	await page.click('button:has-text("Join")');
	await expect(page.getByText('Your Narrative')).toBeVisible();

	// player B - tyrannical
	const ctxB = await browser.newContext();
	const pageB = await ctxB.newPage();
	await pageB.goto('/');
	await pageB.fill('input[placeholder="Your name"]', 'Bert');
	await pageB.selectOption('select', 'tyrannical');
	await pageB.click('button:has-text("Join")');

	// player C - corrupt_chancellor
	const ctxC = await browser.newContext();
	const pageC = await ctxC.newPage();
	await pageC.goto('/');
	await pageC.fill('input[placeholder="Your name"]', 'Cara');
	await pageC.selectOption('select', 'corrupt_chancellor');
	await pageC.click('button:has-text("Join")');

	// Have B trigger an action to produce narratives
	await pageB.click('button:has-text("Investigate")');

	// Expect different narratives to appear across players
	await expect(page.getByTestId('narrative-box')).toContainText(/King|rebellion|corrupt/i, { timeout: 10000 });
	await expect(pageB.getByTestId('narrative-box')).toContainText(/King|rebellion|corrupt/i, { timeout: 10000 });
	await expect(pageC.getByTestId('narrative-box')).toContainText(/King|rebellion|corrupt/i, { timeout: 10000 });
});


