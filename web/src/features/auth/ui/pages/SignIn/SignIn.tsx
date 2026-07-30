import { type FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks';
import { Button, Input } from '../../../../../shared/ui';
import { getErrorMessage } from '../../../../../shared/utils';
import { useLoginMutation } from '../../../api/auth.api';
import '../AuthPages.css';

type RedirectState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

export const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    const state = location.state as RedirectState | null;
    const pathname = state?.from?.pathname && state.from.pathname !== '/sign-in' ? state.from.pathname : '/dashboard';

    return `${pathname}${state?.from?.search ?? ''}`;
  }, [location.state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await login({
        email,
        password
      }).unwrap();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to sign in'));
    }
  };

  if (user) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">Account</p>
        <h1>Sign in</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            label="Email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <Input
            autoComplete="current-password"
            label="Password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {formError ? <p className="auth-form__error">{formError}</p> : null}
          <Button disabled={isLoading} icon={<LogIn size={16} />} type="submit">
            {isLoading ? 'Signing in' : 'Sign in'}
          </Button>
        </form>
        <p className="auth-switch">
          New to BidArena? <Link to="/sign-up">Create an account</Link>
        </p>
      </div>
    </section>
  );
};
