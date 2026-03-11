import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const mockFetch = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function renderApp(route = '/') {
	return render(
		<MemoryRouter initialEntries={[route]}>
			<App />
		</MemoryRouter>
	);
}

describe('App', () => {
	it('renders home page at /', async () => {
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve({ user: null })
		});
		renderApp('/');
		await waitFor(() => {
			expect(screen.getByText('My App', { selector: 'h1' })).toBeInTheDocument();
		});
	});

	it('renders auth page at /auth', async () => {
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve({ user: null })
		});
		renderApp('/auth');
		await waitFor(() => {
			expect(
				screen.getByText("Enter your email and we'll send you a magic link.")
			).toBeInTheDocument();
		});
	});

	it('redirects to /auth for /dashboard when unauthenticated', async () => {
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve({ user: null })
		});
		renderApp('/dashboard');
		await waitFor(() => {
			expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
		});
	});

	it('renders dashboard when authenticated', async () => {
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve({ user: { id: '1', email: 'test@example.com' } })
		});
		renderApp('/dashboard');
		await waitFor(() => {
			expect(screen.getByText('Welcome back')).toBeInTheDocument();
		});
	});
});
