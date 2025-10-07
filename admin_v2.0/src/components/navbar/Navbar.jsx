import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { DarkModeContext } from "../../context/darkModeContext";
import { AuthContext } from "../../context/AuthContext";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onToggleSidebar = () => {} }) => {
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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-lg dark:border-dark-border dark:bg-dark-surface/80">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-secondary transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:border-dark-border dark:text-dark-text-secondary dark:hover:bg-primary/20 lg:hidden"
            aria-label="Toggle navigation menu"
            onClick={onToggleSidebar}
          >
            <MenuRoundedIcon fontSize="small" />
          </button>
          <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
            Admin Console
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-primary/10 text-primary transition hover:bg-primary/20 dark:bg-primary/20"
            aria-label="Toggle dark mode"
            onClick={() => dispatch({ type: "TOGGLE" })}
          >
            <DarkModeOutlinedIcon fontSize="small" />
          </button>

          <div
            ref={profileRef}
            className={`relative ${profileOpen ? "is-open" : ""}`}
          >
            <button
              type="button"
              className="flex items-center gap-3 rounded-full border border-border bg-surface px-3 py-1.5 text-left transition hover:border-primary/40 hover:bg-primary/10 dark:border-dark-border dark:bg-dark-surface"
              onClick={toggleProfileMenu}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <img
                src={profileAvatar}
                alt={profileName}
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="flex flex-col text-left">
                <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  {profileName}
                </span>
                <span className="text-xs text-text-muted dark:text-dark-text-muted">
                  {profileRole}
                </span>
              </span>
              <KeyboardArrowDownRoundedIcon
                fontSize="small"
                className={`text-text-muted transition duration-200 dark:text-dark-text-muted ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-soft dark:border-dark-border dark:bg-dark-surface"
                role="menu"
              >
                {profileActions.map(({ label, Icon, onClick }) => (
                  <button
                    type="button"
                    key={label}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-text-secondary transition hover:bg-primary/10 hover:text-primary dark:text-dark-text-secondary dark:hover:bg-primary/20"
                    role="menuitem"
                    onClick={() => handleProfileAction(onClick)}
                  >
                    {Icon ? <Icon fontSize="small" /> : null}
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
