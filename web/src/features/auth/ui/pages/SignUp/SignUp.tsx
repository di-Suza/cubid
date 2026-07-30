import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks';
import { Button, Input } from '../../../../../shared/ui';
import { getErrorMessage } from '../../../../../shared/utils';
import { useRegisterMutation } from '../../../api/auth.api';
import '../AuthPages.css';

export const SignUpPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [register, { isLoading }] = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await register({
        name,
        email,
        password
      }).unwrap();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create your account'));
    }
  };

  if (user) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <p className="eyebrow">Account</p>
        <h1>Create account</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            autoComplete="name"
            label="Name"
            maxLength={80}
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
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
            autoComplete="new-password"
            label="Password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {formError ? <p className="auth-form__error">{formError}</p> : null}
          <Button disabled={isLoading} icon={<UserPlus size={16} />} type="submit">
            {isLoading ? 'Creating account' : 'Create account'}
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </div>
    </section>
  );
};
