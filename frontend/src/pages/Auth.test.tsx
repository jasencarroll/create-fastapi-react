import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from './Auth';

vi.mock('@/hooks/useAuth', () => ({
	useAuth: vi.fn()
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

vi.mock('@/lib/api', () => ({
	apiPost: vi.fn()
}));

import { apiPost } from '@/lib/api';

const mockApiPost = vi.mocked(apiPost);

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function renderAuth() {
	return render(
		<MemoryRouter initialEntries={['/auth']}>
			<Auth />
		</MemoryRouter>
	);
}

describe('Auth', () => {
	it('returns null while loading', () => {
		mockUseAuth.mockReturnValue({ user: null, loading: true, refresh: vi.fn() });
		const { container } = renderAuth();
		expect(container.innerHTML).toBe('');
	});

	it('redirects to dashboard when already authenticated', () => {
		mockUseAuth.mockReturnValue({
			user: { id: '1', email: 'a@b.com' },
			loading: false,
			refresh: vi.fn()
		});
		renderAuth();
		expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
	});

	it('renders magic link form', () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		renderAuth();
		expect(screen.getByText('Sign in')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByText('Send magic link')).toBeInTheDocument();
	});

	it('sends magic link and shows confirmation', async () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		mockApiPost.mockResolvedValue({ success: true });

		renderAuth();
		await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
		await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }));

		await waitFor(() => {
			expect(mockApiPost).toHaveBeenCalledWith('/api/auth/send-magic-link', {
				email: 'test@example.com'
			});
		});
		expect(screen.getByText('Check your email')).toBeInTheDocument();
	});

	it('shows error message on api failure', async () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		mockApiPost.mockRejectedValue(new Error('Invalid email address'));

		renderAuth();
		await userEvent.type(screen.getByLabelText('Email'), 'bad@example.com');
		await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }));

		await waitFor(() => {
			expect(screen.getByText('Invalid email address')).toBeInTheDocument();
		});
	});

	it('shows generic error for non-Error throws', async () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		mockApiPost.mockRejectedValue('something weird');

		renderAuth();
		await userEvent.type(screen.getByLabelText('Email'), 'bad@example.com');
		await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }));

		await waitFor(() => {
			expect(
				screen.getByText('Failed to send magic link. Please try again.')
			).toBeInTheDocument();
		});
	});
});
