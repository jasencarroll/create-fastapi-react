import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';

const mockFetch = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
	vi.restoreAllMocks();
});

function TestConsumer() {
	const { user, loading } = useAuth();
	if (loading) return <div>loading</div>;
	return <div>{user ? user.email : 'no user'}</div>;
}

describe('AuthProvider', () => {
	it('fetches user on mount and provides context', async () => {
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve({ user: { id: '1', email: 'test@example.com' } })
		});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		expect(screen.getByText('loading')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('test@example.com')).toBeInTheDocument();
		});
	});

	it('sets user to null when fetch fails', async () => {
		mockFetch.mockRejectedValue(new Error('network error'));

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => {
			expect(screen.getByText('no user')).toBeInTheDocument();
		});
	});

	it('sets user to null when response has no user', async () => {
		mockFetch.mockResolvedValue({
			json: () => Promise.resolve({ user: null })
		});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => {
			expect(screen.getByText('no user')).toBeInTheDocument();
		});
	});
});

describe('useAuth', () => {
	it('returns default context when used outside provider', async () => {
		let refreshFn: () => Promise<void>;
		function Bare() {
			const { user, loading, refresh } = useAuth();
			refreshFn = refresh;
			return (
				<div>
					{String(loading)}-{String(user)}
				</div>
			);
		}
		render(<Bare />);
		expect(screen.getByText('true-null')).toBeInTheDocument();
		await refreshFn!();
	});
});
