import "./navbar.scss";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { DarkModeContext } from "../../context/darkModeContext";
import { AuthContext } from "../../context/AuthContext";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { dispatch } = useContext(DarkModeContext);
  const { dispatch: authDispatch, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const profileActions = useMemo(
    () => [
      {
        label: "View profile",
        Icon: PersonOutlineIcon,
        onClick: () => {
          navigate(user ? "/profile" : "/login");
        },
      },
      {
        label: "Sign out",
        Icon: LogoutOutlinedIcon,
        onClick: () => {
          authDispatch({ type: "LOGOUT" });
          navigate("/login", { replace: true });
        },
      },
    ],
    [authDispatch, navigate, user]
  );

  const profileName = user?.name || user?.username || user?.email || "Guest";
  const profileRole = user?.role || user?.scope || "Administrator";
  const profileAvatar =
    user?.img ||
    user?.avatarUrl ||
    "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=200";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleProfileMenu = () => {
    setProfileOpen((prev) => !prev);
  };

  const handleProfileAction = (callback) => {
    setProfileOpen(false);
    if (typeof callback === "function") {
      callback();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__wrapper">
        <div className="navbar__brand">
          <h1 className="navbar__brandTitle">Admin Console</h1>
        </div>

        <div className="navbar__actions">
          <button
            type="button"
            className="navbar__action navbar__action--icon"
            aria-label="Toggle dark mode"
            onClick={() => dispatch({ type: "TOGGLE" })}
          >
            <DarkModeOutlinedIcon className="navbar__icon" />
          </button>

          <div ref={profileRef} className={`navbar__profile ${profileOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="navbar__profileButton"
              onClick={toggleProfileMenu}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <img src={profileAvatar} alt={profileName} className="navbar__avatar" />
              <span className="navbar__profileDetails">
                <span className="navbar__profileName">{profileName}</span>
                <span className="navbar__profileRole">{profileRole}</span>
              </span>
              <KeyboardArrowDownRoundedIcon className="navbar__chevron" />
            </button>

            {profileOpen && (
              <div className="navbar__menu" role="menu">
                {profileActions.map(({ label, Icon, onClick }) => (
                  <button
                    type="button"
                    key={label}
                    className="navbar__menuItem"
                    role="menuitem"
                    onClick={() => handleProfileAction(onClick)}
                  >
                    <Icon fontSize="small" className="navbar__menuIcon" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
