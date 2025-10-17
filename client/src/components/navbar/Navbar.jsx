import "./navbar.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { logout as logoutRequest } from "../../api/auth";
import { clearAuth } from "../../utils/authStorage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faHome,
  faHotel,
  faCompass,
  faBook,
  faReceipt,
  faSignOutAlt,
  faBed,
  faCalendarCheck,
  faMoneyBillWave,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

const Navbar = () => {
  const { user, dispatch } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin);
  const userRoleLabel = isAdmin ? "Administrator" : "Member";
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const closeUserMenu = () => setShowUserMenu(false);
  const toggleUserMenu = () => setShowUserMenu((prev) => !prev);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error("Failed to terminate session remotely", err);
    } finally {
      clearAuth();
      dispatch({ type: "LOGOUT" });
      navigate("/login", { replace: true });
      setShowUserMenu(false);
    }
  };

  const toggleMenu = () => {
    closeUserMenu();
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    closeUserMenu();
  };

  // Admin Navbar
  if (isAdmin) {
    return (
      <nav className={`navbar navbar--admin ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar__container">
          {/* Brand */}
          <Link to="/" className="navbar__brand" onClick={closeMenu}>
            <div className="navbar__brand-logo">
              <img src="/Icon.ico" alt="StayVista" />
            </div>
            <div className="navbar__brand-content">
              <span className="navbar__brand-name">StayVista</span>
              <span className="navbar__brand-badge">Admin</span>
            </div>
          </Link>

          {/* Mobile Toggle */}
          <button
            className={`navbar__toggle ${isMenuOpen ? "navbar__toggle--active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
          </button>

          {/* Navigation Links */}
          <div className={`navbar__menu ${isMenuOpen ? "navbar__menu--open" : ""}`}>
            <div className="navbar__links navbar__links--primary">
              <Link
                to="/"
                className={`navbar__link ${isActive("/") ? "navbar__link--active" : ""}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faHome} className="navbar__link-icon" />
                <span>Discover</span>
              </Link>
              <Link
                to="/stories"
                className={`navbar__link ${isActive("/stories") ? "navbar__link--active" : ""}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faBook} className="navbar__link-icon" />
                <span>Stories</span>
              </Link>
            </div>

            <div className="navbar__divider"></div>

            <div className="navbar__links navbar__links--admin">
              <Link
                to="/admin/manage-hotel"
                className={`navbar__link ${isActive("/admin/manage-hotel") ? "navbar__link--active" : ""}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faHotel} className="navbar__link-icon" />
                <span>Manage Hotel</span>
              </Link>
              <Link
                to="/admin/manage-rooms"
                className={`navbar__link ${isActive("/admin/manage-rooms") ? "navbar__link--active" : ""}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faBed} className="navbar__link-icon" />
                <span>Manage Rooms</span>
              </Link>
              <Link
                to="/admin/today-bookings"
                className={`navbar__link ${isActive("/admin/today-bookings") ? "navbar__link--active" : ""}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faCalendarCheck} className="navbar__link-icon" />
                <span>Today's Bookings</span>
              </Link>
              <Link
                to="/admin/today-transactions"
                className={`navbar__link ${isActive("/admin/today-transactions") ? "navbar__link--active" : ""}`}
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faMoneyBillWave} className="navbar__link-icon" />
                <span>Today's Transactions</span>
              </Link>
            </div>

            {/* Mobile User Section */}
            {user && (
              <>
                <div className="navbar__divider"></div>
                <div className="navbar__mobile-user">
                  <div className="navbar__mobile-user-header">
                    <div className="navbar__user-avatar">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="navbar__user-info">
                      <span className="navbar__user-name">{user.username}</span>
                      <span className="navbar__user-role">{userRoleLabel}</span>
                    </div>
                  </div>
                  <button
                    className="navbar__link navbar__link--logout"
                    onClick={() => {
                      handleLogout();
                      closeMenu();
                    }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="navbar__link-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Desktop User Menu */}
          {user && (
            <div className="navbar__user-wrapper" ref={userMenuRef}>
              <button
                type="button"
                className="navbar__user-trigger"
                onClick={toggleUserMenu}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <div className="navbar__user-avatar">{user.username?.[0]?.toUpperCase()}</div>
                <div className="navbar__user-info">
                  <span className="navbar__user-name">{user.username}</span>
                  <span className="navbar__user-role">{userRoleLabel}</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`navbar__user-chevron ${showUserMenu ? "navbar__user-chevron--open" : ""}`}
                />
              </button>
              {showUserMenu && (
                <>
                  <div className="navbar__user-menu">
                    <div className="navbar__user-menu-header">
                      <div className="navbar__user-menu-avatar">{user.username?.[0]?.toUpperCase()}</div>
                      <div>
                        <div className="navbar__user-menu-name">{user.username}</div>
                        <div className="navbar__user-menu-email">{user.email || userRoleLabel}</div>
                      </div>
                    </div>
                    <div className="navbar__user-menu-divider"></div>
                    <button className="navbar__user-menu-item" onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                  <div className="navbar__user-menu-backdrop" onClick={closeUserMenu}></div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Overlay */}
        {isMenuOpen && (
          <div className="navbar__overlay" onClick={closeMenu}></div>
        )}
      </nav>
    );
  }

  // Customer Navbar
  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__container">
        {/* Brand */}
        <Link to="/" className="navbar__brand" onClick={closeMenu}>
          <div className="navbar__brand-logo">
            <img src="/Icon.ico" alt="StayVista" />
          </div>
          <div className="navbar__brand-content">
            <span className="navbar__brand-name">StayVista</span>
            <span className="navbar__brand-tagline">Discover Your Stay</span>
          </div>
        </Link>

        {/* Mobile Toggle */}
        <button
          className={`navbar__toggle ${isMenuOpen ? "navbar__toggle--active" : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
        </button>

        {/* Navigation Links */}
        <div className={`navbar__menu ${isMenuOpen ? "navbar__menu--open" : ""}`}>
          <div className="navbar__links">
            <Link
              to="/"
              className={`navbar__link ${isActive("/") ? "navbar__link--active" : ""}`}
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={faHome} className="navbar__link-icon" />
              <span>Discover</span>
            </Link>
            <Link
              to="/hotels"
              className={`navbar__link ${isActive("/hotels") ? "navbar__link--active" : ""}`}
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={faHotel} className="navbar__link-icon" />
              <span>Stays</span>
            </Link>
            <Link
              to="/experiences"
              className={`navbar__link ${isActive("/experiences") ? "navbar__link--active" : ""}`}
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={faCompass} className="navbar__link-icon" />
              <span>Experiences</span>
            </Link>
            <Link
              to="/stories"
              className={`navbar__link ${isActive("/stories") ? "navbar__link--active" : ""}`}
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={faBook} className="navbar__link-icon" />
              <span>Stories</span>
            </Link>
          </div>

          {user && (
            <>
              <div className="navbar__divider"></div>
              <div className="navbar__links">
                <Link
                  to="/bookings"
                  className={`navbar__link ${isActive("/bookings") ? "navbar__link--active" : ""}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={faCalendarCheck} className="navbar__link-icon" />
                  <span>My Bookings</span>
                </Link>
                <Link
                  to="/transactions"
                  className={`navbar__link ${isActive("/transactions") ? "navbar__link--active" : ""}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={faReceipt} className="navbar__link-icon" />
                  <span>Transactions</span>
                </Link>
              </div>
            </>
          )}

          {/* Mobile User Section / Auth Buttons - Always at the end */}
          <div className="navbar__divider"></div>
          <div className="navbar__mobile-actions">
            {user ? (
              <>
                <div className="navbar__mobile-user-header">
                  <div className="navbar__user-avatar">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="navbar__user-info">
                    <span className="navbar__user-name">{user.username}</span>
                    <span className="navbar__user-role">{userRoleLabel}</span>
                  </div>
                </div>
                <button
                  className="navbar__link navbar__link--logout"
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="navbar__link-icon" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="navbar__auth-buttons">
                <Link to="/login" className="navbar__btn navbar__btn--outline" onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/register" className="navbar__btn navbar__btn--primary" onClick={closeMenu}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {!user && (
          <div className="navbar__actions navbar__actions--desktop">
            <Link to="/login" className="navbar__btn navbar__btn--outline">
              Sign In
            </Link>
            <Link to="/register" className="navbar__btn navbar__btn--primary">
              Get Started
            </Link>
          </div>
        )}

        {/* Desktop User Section */}
        {user && (
          <div className="navbar__user navbar__user--desktop">
            <div className="navbar__user-avatar">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="navbar__user-info">
              <span className="navbar__user-name">{user.username}</span>
              <span className="navbar__user-role">{userRoleLabel}</span>
            </div>
            <button
              className="navbar__logout"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div className="navbar__overlay" onClick={closeMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;
