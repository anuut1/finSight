import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Goals' },
  { to: '/analytics', label: 'Analytics' },
];

const Sidebar = () => {
  return (
    <aside
      style={{
        width: 230,
        padding: '1.5rem 1.25rem',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        height: '100vh',
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.3rem',
          }}
        >
          Overview
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.75rem',
              borderRadius: 999,
              fontSize: '0.9rem',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              background: isActive ? 'rgba(79, 142, 247, 0.25)' : 'transparent',
              border: isActive ? '1px solid rgba(79,142,247,0.6)' : '1px solid transparent',
              transition: 'background 0.15s ease, transform 0.12s ease, border 0.15s ease',
              transform: isActive ? 'translateX(2px)' : 'translateX(0)',
            })}
          >
            <span>{link.label}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{'\u203A'}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;

