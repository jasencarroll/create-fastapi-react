import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthUser {
	id: string;
	email: string;
}

interface AuthContextType {
	user: AuthUser | null;
	loading: boolean;
	refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	refresh: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(async () => {
		try {
			const res = await fetch('/api/auth/me');
			const data = await res.json();
			setUser(data.user);
		} catch {
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return <AuthContext.Provider value={{ user, loading, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
