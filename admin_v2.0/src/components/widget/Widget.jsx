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

const iconMap = {
  user: {
    icon: PersonOutlinedIcon,
    styles: "bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-200",
  },
  hotel: {
    icon: HotelOutlinedIcon,
    styles: "bg-blue-100 text-blue-500 dark:bg-blue-500/20 dark:text-blue-200",
  },
  transaction: {
    icon: ReceiptLongOutlinedIcon,
    styles: "bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-200",
  },
  revenue: {
    icon: MonetizationOnOutlinedIcon,
    styles: "bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-200",
  },
};

const Widget = ({ type, value = 0, loading = false, link }) => {
  const config = {
    user: {
      title: "Total Users",
      isMoney: false,
      defaultLink: "Manage users",
    },
    hotel: {
      title: "Total Hotels",
      isMoney: false,
      defaultLink: "View hotel inventory",
    },
    transaction: {
      title: "Transactions",
      isMoney: false,
      defaultLink: "Review payments",
    },
    revenue: {
      title: "Today's Revenue",
      isMoney: true,
      defaultLink: "View booking performance",
    },
  }[type] || {
    title: type?.toUpperCase() || "Metric",
    isMoney: false,
    defaultLink: "View details",
  };

  const displayValue = loading
    ? "…"
    : config.isMoney
    ? formatCurrency(value)
    : formatNumber(value);

  const linkLabel = link?.label || link || config.defaultLink;
  const linkPath = link?.to;

  const IconInfo = iconMap[type];
  const Icon = IconInfo?.icon;
  const iconClasses = IconInfo?.styles || "bg-primary/10 text-primary";

  return (
    <article className="surface-card flex items-center justify-between gap-6 p-6 dark:border-dark-border dark:bg-dark-surface">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
          {config.title}
        </span>
        <span className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
          {displayValue}
        </span>
        {linkPath ? (
          <Link
            to={linkPath}
            className="text-sm font-medium text-primary transition hover:text-primary-dark"
          >
            {linkLabel}
          </Link>
        ) : (
          <span className="text-sm font-medium text-primary dark:text-primary">
            {linkLabel}
          </span>
        )}
      </div>
      {Icon && (
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${iconClasses}`}
        >
          <Icon fontSize="medium" />
        </div>
      )}
    </article>
  );
};

export default Widget;
