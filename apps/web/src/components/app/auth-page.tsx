import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/logo-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

type Mode = 'login' | 'register';

export function AuthPage() {
  const { status, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authed') return <Navigate to={from} replace />;

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await (mode === 'login' ? login : register)(
      email.trim().toLowerCase(),
      password,
    );
    setBusy(false);
    if (result.ok) navigate(from, { replace: true });
    else setError(result.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6">
        <div className="mb-1 flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark size={20} className="text-up" />
          tick-trader
        </div>
        <p className="mb-6 font-mono text-xs text-muted-foreground">
          $ {mode === 'login' ? 'auth login' : 'auth register'} --paper
        </p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'register' ? (
              <span className="text-xs text-muted-foreground">At least 8 characters.</span>
            ) : null}
          </div>
          {error ? <p className="text-xs text-down">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 w-full font-mono text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          {mode === 'login'
            ? '// new here? create an account'
            : '// already have an account? sign in'}
        </button>
      </div>
    </div>
  );
}
