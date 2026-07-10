import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../utils/constants';
import * as notificationsApi from '../api/notificationsApi';

const MENU_BY_ROLE = {
  [ROLES.EMPLOYEE]: [
    { to: '/', label: 'Dashboard' },
    { to: '/ideas', label: 'My Ideas' },
    { to: '/ideas/new', label: 'New Idea' },
  ],
  [ROLES.COORDINATOR]: [
    { to: '/', label: 'Dashboard' },
    { to: '/ideas', label: 'Screening Queue' },
  ],
  [ROLES.EVALUATOR]: [
    { to: '/', label: 'Dashboard' },
    { to: '/ideas', label: 'Evaluation Queue' },
  ],
  [ROLES.COMMITTEE]: [
    { to: '/', label: 'Dashboard' },
    { to: '/ideas', label: 'Decision & Execution' },
  ],
  [ROLES.ADMIN]: [
    { to: '/', label: 'Dashboard' },
    { to: '/ideas', label: 'All Ideas' },
    { to: '/users', label: 'Users' },
    { to: '/audit-log', label: 'Audit Log' },
    { to: '/settings', label: 'Settings' },
  ],
};

// Every role can reach account settings to change their own password;
// only Admin's menu already includes it above, so we add it once more here
// for the other four roles.
Object.keys(MENU_BY_ROLE).forEach((role) => {
  if (role !== ROLES.ADMIN) {
    MENU_BY_ROLE[role].push({ to: '/settings', label: 'Settings' });
  }
});

/** Shell layout: sidebar with a role-based menu, top bar with notifications + logout. */
function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    const { data } = await notificationsApi.listMyNotifications();
    setNotifications(data.data.notifications);
    setUnreadCount(data.data.unreadCount);
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBellClick = async () => {
    setShowNotifications((v) => !v);
    if (unreadCount > 0) {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
    }
  };

  const menu = MENU_BY_ROLE[user.role] || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Innovation Platform</div>
        <nav className="sidebar-nav">
          {menu.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="sidebar-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-user">
            <strong>{user.username}</strong>
            <span className="role-pill">{ROLE_LABELS[user.role]}</span>
          </div>
          <div className="topbar-actions">
            <button className="bell-button" onClick={handleBellClick}>
              Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
          {showNotifications && (
            <div className="notification-panel">
              {notifications.length === 0 && <p className="empty-state">No notifications yet</p>}
              {notifications.map((n) => (
                <div key={n._id} className={`notification-item ${n.isRead ? '' : 'unread'}`}>
                  <p>{n.message}</p>
                  <span className="timeline-date">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
