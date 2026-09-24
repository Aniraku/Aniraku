// Consumer half of Aniraku's src/hooks/useAuth.jsx, split per the TS port
// contract: the provider lives in src/providers/AuthProvider.tsx, the hook here.
// Returns null when used outside the provider (same as Aniraku's raw useContext).
import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../providers/AuthProvider';

export const useAuth = (): AuthContextValue | null => useContext(AuthContext);

export type { AuthContextValue };
