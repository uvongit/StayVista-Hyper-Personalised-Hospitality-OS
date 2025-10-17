import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import StoreIcon from "@mui/icons-material/Store";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useContext, useEffect, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { logout as logoutRequest } from "../../api/services";
import { clearAuth } from "../../utils/authStorage";

const baseItemClasses =
  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200";

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { dispatch: authDispatch, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error("Failed to terminate admin session remotely", err);
    } finally {
      clearAuth();
      authDispatch({ type: "LOGOUT" });
      navigate("/login", { replace: true });
    }
  }, [authDispatch, navigate]);

  const containerClasses = useMemo(() => {
    const base =
      "fixed inset-y-0 left-0 z-50 flex w-64 min-w-[16rem] flex-col border-r border-border bg-surface px-5 py-6 shadow-soft transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-dark-surface";
    return isOpen ? `${base} translate-x-0` : `${base} -translate-x-full lg:translate-x-0`;
  }, [isOpen]);

  const overlayClasses = useMemo(
    () =>
      isOpen
        ? "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
        : "pointer-events-none fixed inset-0 z-40 opacity-0 lg:hidden",
    [isOpen]
  );

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [isOpen]);

  const makeLinkProps = (to) => ({
    to,
    className: "no-underline",
    onClick: () => {
      onClose();
    },
  });

  const isRouteActive = useCallback(
    (target) => {
      if (!target) return false;
      const normalized = target.endsWith("/") ? target.slice(0, -1) : target;
      const current = location.pathname.endsWith("/")
        ? location.pathname.slice(0, -1)
        : location.pathname;
      return current === normalized || current.startsWith(`${normalized}/`);
    },
    [location.pathname]
  );

  return (
    <>
      <div className={overlayClasses} role="presentation" onClick={onClose} />
      <aside className={containerClasses}>
        <div className="flex items-center justify-between gap-3">
          <Link {...makeLinkProps("/")}>
            <span className="text-xl font-semibold tracking-wide text-primary dark:text-primary">
              StayVista
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-text-muted transition hover:bg-primary/10 hover:text-primary lg:hidden"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        <hr className="border-dashed border-border/60 dark:border-dark-border/70" />

        <nav className="flex-1 overflow-y-auto pr-1">
          <ul className="grid gap-2">
            <SidebarSection title="Main">
              <SidebarLink
                to="/"
                icon={DashboardIcon}
                label="Dashboard"
                isActive={location.pathname === "/"}
                onNavigate={onClose}
              />
            </SidebarSection>

            <SidebarSection title="Lists">
              <SidebarLink
                to="/users"
                icon={PersonOutlineIcon}
                label="Users"
                isActive={isRouteActive("/users")}
                onNavigate={onClose}
              />
              <SidebarLink
                to="/hotels"
                icon={StoreIcon}
                label="Hotels"
                isActive={isRouteActive("/hotels")}
                onNavigate={onClose}
              />
              <SidebarLink
                to="/rooms"
                icon={CreditCardIcon}
                label="Rooms"
                isActive={isRouteActive("/rooms")}
                onNavigate={onClose}
              />
              <SidebarLink
                to="/bookings"
                icon={EventAvailableOutlinedIcon}
                label="Bookings"
                isActive={isRouteActive("/bookings")}
                onNavigate={onClose}
              />
              <SidebarLink
                to="/transactions"
                icon={ReceiptLongOutlinedIcon}
                label="Transactions"
                isActive={isRouteActive("/transactions")}
                onNavigate={onClose}
              />
            </SidebarSection>

            <SidebarSection title="Useful">
              <SidebarLink
                to="/stats"
                icon={InsertChartIcon}
                label="Stats"
                isActive={isRouteActive("/stats")}
                onNavigate={onClose}
              />
              <SidebarLink
                to="/logs"
                icon={PsychologyOutlinedIcon}
                label="Logs"
                isActive={isRouteActive("/logs")}
                onNavigate={onClose}
              />
            </SidebarSection>

            <SidebarSection title="User">
              <SidebarLink
                to={user ? "/profile" : "#"}
                icon={AccountCircleOutlinedIcon}
                label="Profile"
                disabled={!user}
                isActive={isRouteActive("/profile")}
                onNavigate={onClose}
              />
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={!user}
                  className={`${baseItemClasses} w-full justify-start border border-transparent bg-red-50 text-danger hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-text-muted dark:bg-red-500/10 dark:text-danger dark:hover:bg-danger/20 dark:disabled:bg-transparent`}
                >
                  <ExitToAppIcon fontSize="small" className="text-inherit" />
                  <span>Logout</span>
                </button>
              </li>
            </SidebarSection>
          </ul>
        </nav>

        <div className="min-h-4" />
      </aside>
    </>
  );
};

const SidebarSection = ({ title, children }) => (
  <li>
    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted dark:text-dark-text-muted">
      {title}
    </p>
    <ul className="grid gap-1.5">{children}</ul>
  </li>
);

const SidebarLink = ({
  to,
  icon: IconComponent,
  label,
  disabled = false,
  isActive = false,
  onNavigate = () => {},
}) => {
  const activeClasses = isActive
    ? "bg-primary/10 text-primary dark:bg-primary/20"
    : "text-text-secondary hover:-translate-x-0.5 hover:bg-primary/10 hover:text-primary dark:text-dark-text-secondary dark:hover:bg-primary/20";

  const content = (
    <span
      className={`${baseItemClasses} ${
        disabled
          ? "cursor-not-allowed text-text-muted opacity-70 dark:text-dark-text-muted"
          : activeClasses
      }`}
    >
      {IconComponent ? <IconComponent className="text-inherit" fontSize="small" /> : null}
      <span>{label}</span>
    </span>
  );

  if (disabled) {
    return <li>{content}</li>;
  }

  return (
    <li>
      <Link
        to={to}
        className="no-underline"
        onClick={() => {
          onNavigate();
        }}
      >
        {content}
      </Link>
    </li>
  );
};

export default Sidebar;
