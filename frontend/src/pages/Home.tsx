import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Home() {
	const { user } = useAuth();

	return (
		<div className="mx-auto max-w-3xl px-6 pb-16 pt-16">
			<div className="text-center">
				<h1 className="mb-4 text-6xl font-bold text-foreground">My App</h1>
				<p className="mb-8 text-xl text-muted-foreground">
					A full-stack application built with FastAPI and React.
				</p>
				{user ? (
					<Button asChild size="lg">
						<Link to="/dashboard">Go to Dashboard</Link>
					</Button>
				) : (
					<Button asChild size="lg">
						<Link to="/auth">Get Started</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
