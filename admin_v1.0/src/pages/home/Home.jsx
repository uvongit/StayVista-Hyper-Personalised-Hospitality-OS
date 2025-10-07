import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import "./home.scss";
import Widget from "../../components/widget/Widget";
import Featured from "../../components/featured/Featured";
import Chart from "../../components/chart/Chart";
import Table from "../../components/table/Table";
import { fetchAnalyticsSummary } from "../../api/services";

const INITIAL_SUMMARY = {
  totalUsers: 0,
  totalHotels: 0,
  totalTransactions: 0,
  todayBookingAmount: 0,
  revenueComparison: {
    target: 0,
    yesterday: 0,
    lastWeek: 0,
  },
  revenueTrend: [],
};

const Home = () => {
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const loadSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAnalyticsSummary();
        if (!ignore) {
          setSummary((prev) => ({
            ...prev,
            ...data,
            revenueComparison: {
              ...prev.revenueComparison,
              ...(data?.revenueComparison || {}),
            },
            revenueTrend: Array.isArray(data?.revenueTrend) ? data.revenueTrend : prev.revenueTrend,
          }));
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message || err?.message || "Unable to load analytics overview."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      ignore = true;
    };
  }, []);

  const widgets = [
    {
      type: "user",
      value: summary.totalUsers,
      link: { label: "Manage users", to: "/users" },
    },
    {
      type: "hotel",
      value: summary.totalHotels,
      link: { label: "View hotels", to: "/hotels" },
    },
    {
      type: "transaction",
      value: summary.totalTransactions,
      link: { label: "View transactions", to: "/transactions" },
    },
    {
      type: "revenue",
      value: summary.todayBookingAmount,
      link: { label: "Today's booking revenue", to: "/stats" },
    },
  ];

  return (
    <div className="home">
      <Sidebar />
      <div className="homeContainer">
        <Navbar />
        {error && <div className="homeError">{error}</div>}
        <div className="widgets">
          {widgets.map((widget) => (
            <Widget
              key={widget.type}
              type={widget.type}
              value={widget.value}
              loading={loading}
              link={widget.link}
            />
          ))}
        </div>
        <div className="charts">
          <Featured
            amount={summary.todayBookingAmount}
            loading={loading}
            comparison={summary.revenueComparison}
          />
          <Chart
            title="Last 6 Months (Revenue)"
            aspect={2 / 1}
            data={summary.revenueTrend}
            loading={loading}
          />
        </div>
        <div className="listContainer">
          <div className="listTitle">Latest Transactions</div>
          <Table />
        </div>
      </div>
    </div>
  );
};

export default Home;
