import { expect, test } from '@playwright/test';

test.describe('auth flow', () => {
	test('send magic link shows confirmation', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByText('Enter your email to receive a magic link')).toBeVisible();

		await page.getByLabel('Email').fill('test@example.com');
		await page.getByRole('button', { name: 'Send magic link' }).click();

		await expect(page.getByText('Check your email')).toBeVisible();
		await expect(page.getByText('test@example.com')).toBeVisible();
	});

	test('invalid email shows error', async ({ page }) => {
		await page.goto('/auth');
		await page.getByLabel('Email').fill('invalid');
		await page.getByRole('button', { name: 'Send magic link' }).click();

		await expect(page.getByText('Invalid email address')).toBeVisible();
	});

	test('dashboard redirects to auth when not logged in', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page.getByText('Enter your email to receive a magic link')).toBeVisible();
	});

	test('home page shows Get Started when not logged in', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
	});
});
