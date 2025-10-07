import { faBed, faPlane, faCar, faTaxi, faPlaneDeparture, faBuilding } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./header.css";
import { AuthContext } from "../../context/AuthContext";

export const heroNavItems = [
  { icon: faBed, label: "Stays", path: "/hotels", match: ["/", "/hotels"], hideForAdmin: true },
  { icon: faPlane, label: "Flights", path: "/flights" },
  { icon: faCar, label: "Car rentals", path: "/car-rentals" },
  { icon: faBed, label: "Attractions", path: "/attractions" },
  { icon: faPlaneDeparture, label: "Airports", path: "/airports" },
  { icon: faTaxi, label: "Airport taxis", path: "/taxis" },
  { icon: faBuilding, label: "Manage hotel", path: "/admin/manage-hotel", adminOnly: true },
];

const HeroNav = ({ variant, className = "" }) => {
  const { user } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin);
  const navigate = useNavigate();
  const location = useLocation();
  const variantClass = variant ? ` hero__nav--${variant}` : "";
  const containerClass = ["hero__nav", variantClass, className].filter(Boolean).join(" ");
  const items = heroNavItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.hideForAdmin) return !isAdmin;
    return true;
  });

  return (
    <div className={containerClass}>
      {items.map(({ icon, label, path, match }) => {
        const activePaths = match ?? [path];
        const isActive = activePaths.some((route) => location.pathname === route);
        return (
          <button
            key={label}
            type="button"
            className={`hero__nav-pill ${isActive ? "hero__nav-pill--active" : ""}`}
            onClick={() => navigate(path)}
          >
            <FontAwesomeIcon icon={icon} className="hero__nav-icon" />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default HeroNav;
