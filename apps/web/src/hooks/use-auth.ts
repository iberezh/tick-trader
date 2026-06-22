import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import {
  type Account,
  type AuthResult,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getMe,
} from '@/lib/api';

type Status = 'loading' | 'authed' | 'anon';

const accountAtom = atom<Account | null>(null);
const statusAtom = atom<Status>('loading');

// Module-level guard so the /auth/me probe fires once per page load, not once per mount
// (StrictMode double-invokes effects, and several components read auth state).
let probed = false;

interface Auth {
  account: Account | null;
  status: Status;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

export function useAuth(): Auth {
  const [account, setAccount] = useAtom(accountAtom);
  const [status, setStatus] = useAtom(statusAtom);

  useEffect(() => {
    if (probed) return;
    probed = true;
    getMe().then((a) => {
      setAccount(a);
      setStatus(a ? 'authed' : 'anon');
    });
  }, [setAccount, setStatus]);

  const adopt = useCallback(
    (result: AuthResult): AuthResult => {
      if (result.ok) {
        setAccount(result.account);
        setStatus('authed');
      }
      return result;
    },
    [setAccount, setStatus],
  );

  const login = useCallback(
    async (email: string, password: string) => adopt(await apiLogin({ email, password })),
    [adopt],
  );
  const register = useCallback(
    async (email: string, password: string) => adopt(await apiRegister({ email, password })),
    [adopt],
  );
  const logout = useCallback(async () => {
    await apiLogout();
    setAccount(null);
    setStatus('anon');
  }, [setAccount, setStatus]);

  return { account, status, login, register, logout };
}
