import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';

vi.mock('@/hooks/useAuth', () => ({
	useAuth: vi.fn()
}));

import { useAuth } from '@/hooks/useAuth';

const mockUseAuth = vi.mocked(useAuth);

describe('Dashboard', () => {
	it('displays user email', () => {
		mockUseAuth.mockReturnValue({
			user: { id: '1', email: 'test@example.com' },
			loading: false,
			refresh: vi.fn()
		});
		render(<Dashboard />);
		expect(screen.getByText('Welcome back')).toBeInTheDocument();
		expect(screen.getByText('You are signed in as test@example.com')).toBeInTheDocument();
	});
});
