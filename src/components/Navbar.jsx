import { useState } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { FiArrowUpRight, FiMenu, FiPhone, FiX } from "react-icons/fi";
import { auth } from "../firebase";
import SocialLinks from "./SocialLinks.jsx";

const navItems = [
  ["Our journeys", "#journeys"],
  ["The island", "#vehicle"],
  ["Guest stories", "#reviews"],
];

const phoneNumber = "0382292953";
const phoneLink = "+94382292953";

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut(auth);
      setMenuOpen(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link className="brand" to="/" aria-label="Ceylone Vibe home">
          <span className="brand-mark">C</span>
          <span>Ceylone<span className="brand-period"> Vibe</span></span>
        </Link>

        <div className="desktop-nav">
          {navItems.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </div>

        <div className="nav-actions">
          <SocialLinks className="nav-social-links" />
          <a className="nav-phone" href={`tel:${phoneLink}`} aria-label={`Call Ceylone Vibe at ${phoneNumber}`}>
            <FiPhone aria-hidden="true" />
            <span>{phoneNumber}</span>
          </a>
          {user ? (
            <>
              <span className="nav-user" title={user.email}>
                {user.displayName?.split(" ")[0] || "Traveler"}
              </span>
              <button className="nav-signin" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <Link className="nav-signin" to="/auth">Log in</Link>
          )}
          <a className="nav-cta" href="#journeys">
            Plan your trip <FiArrowUpRight aria-hidden="true" />
          </a>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a href={`tel:${phoneLink}`} onClick={() => setMenuOpen(false)}>
            <FiPhone aria-hidden="true" /> Call {phoneNumber}
          </a>
          <SocialLinks className="mobile-social-links" />
          {user ? (
            <button type="button" onClick={handleSignOut}>Sign out</button>
          ) : (
            <Link to="/auth" onClick={() => setMenuOpen(false)}>Log in or sign up</Link>
          )}
        </div>
      )}
    </header>
  );
}
