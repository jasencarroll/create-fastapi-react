import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/hooks/useAuth', () => ({
	useAuth: vi.fn()
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/dashboard']) {
	return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('ProtectedRoute', () => {
	it('returns null while loading', () => {
		mockUseAuth.mockReturnValue({ user: null, loading: true, refresh: vi.fn() });
		const { container } = renderWithRouter(
			<ProtectedRoute>
				<div>secret</div>
			</ProtectedRoute>
		);
		expect(container.innerHTML).toBe('');
	});

	it('redirects to /auth when not authenticated', () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		renderWithRouter(
			<ProtectedRoute>
				<div>secret</div>
			</ProtectedRoute>
		);
		expect(screen.queryByText('secret')).not.toBeInTheDocument();
	});

	it('renders children when authenticated', () => {
		mockUseAuth.mockReturnValue({
			user: { id: '1', email: 'a@b.com' },
			loading: false,
			refresh: vi.fn()
		});
		renderWithRouter(
			<ProtectedRoute>
				<div>secret</div>
			</ProtectedRoute>
		);
		expect(screen.getByText('secret')).toBeInTheDocument();
	});
});
