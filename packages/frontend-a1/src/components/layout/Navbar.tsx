import { NavLink }   from 'react-router-dom';
import styles        from './Navbar.module.css';

const NAV_LINKS = [
  { to: '/',                  label: 'Početna'      },
  { to: '/usluge',            label: 'Usluge'       },
  { to: '/rezervacija',       label: 'Rezervišite'  },
  { to: '/moja-rezervacija',  label: 'Moja rezervacija' },
];

export function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        {/* Logo */}
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoIcon}>✂</span>
          <span>Salon Trač</span>
        </NavLink>

        {/* Links */}
        <ul className={styles.links}>
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
