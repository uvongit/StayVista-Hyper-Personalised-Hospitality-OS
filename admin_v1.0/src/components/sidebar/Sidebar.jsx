import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import "./sidebar.scss";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import StoreIcon from "@mui/icons-material/Store";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Sidebar = () => {
  const { dispatch: authDispatch, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    authDispatch({ type: "LOGOUT" });
    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar">
      <div className="top">
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="logo">StayVista</span>
        </Link>
      </div>
      <hr />
      <div className="center">
        <ul>
          <p className="title">MAIN</p>
          <Link to="/" style={{ textDecoration: "none" }}>
            <li>
              <DashboardIcon className="icon" />
              <span>Dashboard</span>
            </li>
          </Link>
          <p className="title">LISTS</p>
          <Link to="/users" style={{ textDecoration: "none" }}>
            <li>
              <PersonOutlineIcon className="icon" />
              <span>Users</span>
            </li>
          </Link>
          <Link to="/hotels" style={{ textDecoration: "none" }}>
            <li>
              <StoreIcon className="icon" />
              <span>Hotels</span>
            </li>
          </Link>
          <Link to="/rooms" style={{ textDecoration: "none" }}>
            <li>
              <CreditCardIcon className="icon" />
              <span>Rooms</span>
            </li>
          </Link>
          <Link to="/bookings" style={{ textDecoration: "none" }}>
            <li>
              <EventAvailableOutlinedIcon className="icon" />
              <span>Bookings</span>
            </li>
          </Link>
          <Link to="/transactions" style={{ textDecoration: "none" }}>
            <li>
              <ReceiptLongOutlinedIcon className="icon" />
              <span>Transactions</span>
            </li>
          </Link>
          <p className="title">USEFUL</p>
          <Link to="/stats" style={{ textDecoration: "none" }}>
            <li>
              <InsertChartIcon className="icon" />
              <span>Stats</span>
            </li>
          </Link>
          <Link to="/logs" style={{ textDecoration: "none" }}>
            <li>
              <PsychologyOutlinedIcon className="icon" />
              <span>Logs</span>
            </li>
          </Link>
          <p className="title">USER</p>
          <Link
            to={user ? "/profile" : "#"}
            style={{ textDecoration: "none" }}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
              }
            }}
          >
            <li className={user ? "" : "disabled"}>
              <AccountCircleOutlinedIcon className="icon" />
              <span>Profile</span>
            </li>
          </Link>
          <li onClick={handleLogout} className={user ? "logout" : "disabled"}>
            <ExitToAppIcon className="icon" />
            <span>Logout</span>
          </li>
        </ul>
      </div>
      <div className="bottom" />
    </div>
  );
};

export default Sidebar;
