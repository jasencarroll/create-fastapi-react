import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Home } from './Home';

vi.mock('@/hooks/useAuth', () => ({
	useAuth: vi.fn()
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

afterEach(() => {
	cleanup();
});

function renderHome() {
	return render(
		<MemoryRouter>
			<Home />
		</MemoryRouter>
	);
}

describe('Home', () => {
	it('shows Get Started when not authenticated', () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		renderHome();
		expect(screen.getByText('My App')).toBeInTheDocument();
		expect(screen.getByText('Get Started')).toBeInTheDocument();
	});

	it('shows Go to Dashboard when authenticated', () => {
		mockUseAuth.mockReturnValue({
			user: { id: '1', email: 'a@b.com' },
			loading: false,
			refresh: vi.fn()
		});
		renderHome();
		expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
	});
});
