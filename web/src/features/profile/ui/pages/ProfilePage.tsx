import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../../../app/store/hooks';
import { useLogoutMutation } from '../../../auth';
import { Button } from '../../../../shared/ui';
import './ProfilePage.css';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [logout, { isLoading }] = useLogoutMutation();
  const initials = (user?.name ?? 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout().unwrap().catch(() => undefined);
    navigate('/', { replace: true });
  };

  return (
    <section className="profile-page">
      <header className="profile-page__header">
        <p className="eyebrow">Profile</p>
        <h1>{user?.name ?? 'User profile'}</h1>
        <p>Manage your Cubid identity, account role, and active session.</p>
      </header>

      <div className="profile-card">
        <div className="profile-card__hero">
          <div className="profile-card__avatar">
            <span>{initials}</span>
            <UserRound size={22} />
          </div>
          <div>
            <span className="profile-card__label">Signed in as</span>
            <strong>{user?.name ?? 'User'}</strong>
            <p>{user?.email ?? '--'}</p>
          </div>
          <span className="profile-card__status">{user?.status ?? 'ACTIVE'}</span>
        </div>

        <dl className="profile-card__details">
          <div className="profile-card__detail">
            <dt>
              <Mail size={16} />
              Email
            </dt>
            <dd>{user?.email ?? '--'}</dd>
          </div>
          <div className="profile-card__detail">
            <dt>
              <ShieldCheck size={16} />
              Role
            </dt>
            <dd>{user?.role ?? 'USER'}</dd>
          </div>

          <div className="profile-card__detail">
            <dt>Status</dt>
            <dd>{user?.status ?? '--'}</dd>
          </div>
        </dl>

        <div className="profile-card__actions">
          <div>
            <strong>Session controls</strong>
            <span>Sign out from this browser session.</span>
          </div>
          <Button disabled={isLoading} icon={<LogOut size={16} />} onClick={() => void handleLogout()} variant="secondary">
            Sign out
          </Button>
        </div>
      </div>
    </section>
  );
};
