import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/',           label: 'Dashboard',       icon: '▣' },
  { to: '/servers',    label: 'Servers',          icon: '⬡' },
  { to: '/algorithms', label: 'Algorithms',       icon: '⟳' },
  { to: '/analytics',  label: 'Analytics',        icon: '▲' },
  { to: '/incidents',  label: 'Incidents',        icon: '⚠' },
  { to: '/alerts',     label: 'Alerts',           icon: '◉' },
  { to: '/reports',    label: 'Reports',          icon: '≡' },
  { to: '/settings',   label: 'Settings',         icon: '⚙' },
];

const adminItems = [
  { to: '/users',    label: 'User Management', icon: '◈' },
  { to: '/activity', label: 'Activity Log',    icon: '📋' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-text">LBMS</span>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="nav-divider">Admin</div>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>⏻</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
