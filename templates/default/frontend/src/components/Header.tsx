import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
	const { user } = useAuth();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		navigate('/');
		window.location.reload();
	};

	return (
		<header className="border-b border-border bg-card">
			<div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
				<Link to="/" className="text-2xl font-bold text-foreground no-underline">
					{{appTitle}}
				</Link>
				<nav className="flex items-center gap-4">
					{user ? (
						<>
							<Link
								to="/dashboard"
								className="rounded-md px-3 py-2 text-sm text-muted-foreground no-underline hover:text-foreground"
							>
								Dashboard
							</Link>
							<span className="text-sm text-muted-foreground">{user.email}</span>
							<Button type="button" variant="outline" size="sm" onClick={handleLogout}>
								Log out
							</Button>
						</>
					) : (
						<>
							<Link
								to="/auth"
								className="rounded-md px-3 py-2 text-sm text-muted-foreground no-underline hover:text-foreground"
							>
								Log in
							</Link>
							<Button asChild size="sm">
								<Link to="/auth">Get Started</Link>
							</Button>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}
