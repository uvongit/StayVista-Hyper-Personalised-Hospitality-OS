import "./featured.scss";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

const Featured = ({ amount = 0, loading = false, comparison = {} }) => {
  const safeAmount = typeof amount === "number" ? amount : 0;
  const formattedAmount = safeAmount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });

  const progressValue = Math.min(Math.max((safeAmount / (comparison.target || 1)) * 100, 0), 100);

  const metrics = [
    {
      title: "Target",
      value: comparison.target?.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }) || "—",
      isPositive: safeAmount >= (comparison.target || 0),
    },
    {
      title: "Yesterday",
      value: comparison.yesterday?.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }) || "—",
      isPositive: safeAmount >= (comparison.yesterday || 0),
    },
    {
      title: "Last Week",
      value: comparison.lastWeek?.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }) || "—",
      isPositive: safeAmount >= (comparison.lastWeek || 0),
    },
  ];

  return (
    <div className="featured">
      <div className="top">
        <h1 className="title">Today's booking revenue</h1>
        <MoreVertIcon fontSize="small" />
      </div>
      <div className="bottom">
        <div className="featuredChart">
          <CircularProgressbar
            value={loading ? 0 : Number.isFinite(progressValue) ? progressValue : 0}
            text={loading ? "…" : `${Math.round(progressValue)}%`}
            strokeWidth={5}
          />
        </div>
        <p className="title">Confirmed revenue collected today</p>
        <p className="amount">{loading ? "—" : formattedAmount}</p>
        <p className="desc">
          Metrics refresh on booking confirmation. Pending or failed transactions are excluded.
        </p>
        <div className="summary">
          {metrics.map((metric) => (
            <div className="item" key={metric.title}>
              <div className="itemTitle">{metric.title}</div>
              <div className={`itemResult ${metric.isPositive ? "positive" : "negative"}`}>
                {metric.isPositive ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <div className="resultAmount">{metric.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Featured;
