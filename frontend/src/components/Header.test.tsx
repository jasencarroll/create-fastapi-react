import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('@/hooks/useAuth', () => ({
	useAuth: vi.fn()
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useNavigate: () => mockNavigate
	};
});

const mockFetch = vi.fn();
const mockReload = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch);
	Object.defineProperty(window, 'location', {
		value: { reload: mockReload },
		writable: true
	});
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function renderHeader() {
	return render(
		<MemoryRouter>
			<Header />
		</MemoryRouter>
	);
}

describe('Header', () => {
	it('shows login links when not authenticated', () => {
		mockUseAuth.mockReturnValue({ user: null, loading: false, refresh: vi.fn() });
		renderHeader();
		expect(screen.getByText('Log in')).toBeInTheDocument();
		expect(screen.getByText('Get Started')).toBeInTheDocument();
		expect(screen.queryByText('Log out')).not.toBeInTheDocument();
	});

	it('shows user info and logout when authenticated', () => {
		mockUseAuth.mockReturnValue({
			user: { id: '1', email: 'test@example.com' },
			loading: false,
			refresh: vi.fn()
		});
		renderHeader();
		expect(screen.getByText('test@example.com')).toBeInTheDocument();
		expect(screen.getByText('Dashboard')).toBeInTheDocument();
		expect(screen.getByText('Log out')).toBeInTheDocument();
		expect(screen.queryByText('Log in')).not.toBeInTheDocument();
	});

	it('calls logout API and reloads on logout click', async () => {
		mockUseAuth.mockReturnValue({
			user: { id: '1', email: 'test@example.com' },
			loading: false,
			refresh: vi.fn()
		});
		mockFetch.mockResolvedValue({ ok: true });

		renderHeader();
		await userEvent.click(screen.getByText('Log out'));

		expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
		expect(mockNavigate).toHaveBeenCalledWith('/');
		expect(mockReload).toHaveBeenCalled();
	});
});
