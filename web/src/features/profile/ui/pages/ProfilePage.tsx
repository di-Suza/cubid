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

  const handleLogout = async () => {
    await logout().unwrap().catch(() => undefined);
    navigate('/', { replace: true });
  };

  return (
    <section className="profile-page">
      <header>
        <p className="eyebrow">Profile</p>
        <h1>{user?.name ?? 'User profile'}</h1>
      </header>

      <div className="profile-card">
        <div className="profile-card__avatar">
          <UserRound size={34} />
        </div>
        <dl>
          <div>
            <dt>
              <Mail size={16} />
              Email
            </dt>
            <dd>{user?.email ?? '--'}</dd>
          </div>
          <div>
            <dt>
              <ShieldCheck size={16} />
              Role
            </dt>
            <dd>{user?.role ?? 'USER'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user?.status ?? '--'}</dd>
          </div>
        </dl>
        <Button disabled={isLoading} icon={<LogOut size={16} />} onClick={() => void handleLogout()} variant="secondary">
          Sign out
        </Button>
      </div>
    </section>
  );
};
