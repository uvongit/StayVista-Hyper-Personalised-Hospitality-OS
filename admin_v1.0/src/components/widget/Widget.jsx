import "./widget.scss";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import { Link } from "react-router-dom";

const formatNumber = (value) =>
  typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : value;

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : value;

const Widget = ({ type, value = 0, loading = false, link }) => {
  let data;

  switch (type) {
    case "user":
      data = {
        title: "TOTAL USERS",
        isMoney: false,
        defaultLink: "Manage users",
        icon: (
          <PersonOutlinedIcon
            className="icon"
            style={{ color: "crimson", backgroundColor: "rgba(255, 0, 0, 0.2)" }}
          />
        ),
      };
      break;
    case "hotel":
      data = {
        title: "TOTAL HOTELS",
        isMoney: false,
        defaultLink: "View hotel inventory",
        icon: (
          <HotelOutlinedIcon
            className="icon"
            style={{ color: "royalblue", backgroundColor: "rgba(65, 105, 225, 0.2)" }}
          />
        ),
      };
      break;
    case "transaction":
      data = {
        title: "TRANSACTIONS",
        isMoney: false,
        defaultLink: "Review payments",
        icon: (
          <ReceiptLongOutlinedIcon
            className="icon"
            style={{ color: "darkorange", backgroundColor: "rgba(255, 165, 0, 0.2)" }}
          />
        ),
      };
      break;
    case "revenue":
      data = {
        title: "TODAY'S REVENUE",
        isMoney: true,
        defaultLink: "View booking performance",
        icon: (
          <MonetizationOnOutlinedIcon
            className="icon"
            style={{ color: "green", backgroundColor: "rgba(0, 128, 0, 0.2)" }}
          />
        ),
      };
      break;
    default:
      data = {
        title: type?.toUpperCase() || "METRIC",
        isMoney: false,
        defaultLink: "View details",
        icon: null,
      };
  }

  const displayValue = loading
    ? "…"
    : data.isMoney
    ? formatCurrency(value)
    : formatNumber(value);

  const linkLabel = link?.label || link || data.defaultLink;
  const linkPath = link?.to;

  return (
    <div className="widget">
      <div className="left">
        <span className="title">{data.title}</span>
        <span className="counter">{displayValue}</span>
        {linkPath ? (
          <Link to={linkPath} className="link">
            {linkLabel}
          </Link>
        ) : (
          <span className="link">{linkLabel}</span>
        )}
      </div>
      <div className="right">{data.icon}</div>
    </div>
  );
};

export default Widget;
