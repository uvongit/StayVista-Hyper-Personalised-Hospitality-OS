import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import Featured from "../../components/featured/Featured";
import Chart from "../../components/chart/Chart";
import { fetchAnalyticsSummary, fetchBookings, fetchTransactions } from "../../api/services";
import "./stats.scss";

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

const DEFAULT_BREAKDOWN = {
  confirmed: 0,
  pending: 0,
  cancelled: 0,
  failed: 0,
};

const DEFAULT_TRANSACTION_BREAKDOWN = {
  captured: 0,
  pending: 0,
  refunded: 0,
  failed: 0,
};

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : "—";

const formatNumber = (value) =>
  typeof value === "number" ? value.toLocaleString("en-IN") : "—";

const toPercent = (value, total) => {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

const normalizeBookingStatus = (status = "") => {
  const normalized = status.toString().trim().toLowerCase();
  if (["confirmed", "completed", "success"].includes(normalized)) return "confirmed";
  if (["pending", "processing", "initiated"].includes(normalized)) return "pending";
  if (["cancelled", "canceled", "rejected"].includes(normalized)) return "cancelled";
  if (["failed"].includes(normalized)) return "failed";
  return "pending";
};

const normalizeTransactionStatus = (status = "") => {
  const normalized = status.toString().trim().toLowerCase();
  if (["captured", "success", "completed"].includes(normalized)) return "captured";
  if (["pending", "processing"].includes(normalized)) return "pending";
  if (["refunded", "reversed"].includes(normalized)) return "refunded";
  if (["failed", "declined"].includes(normalized)) return "failed";
  return "pending";
};

const Stats = () => {
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [bookingsBreakdown, setBookingsBreakdown] = useState(DEFAULT_BREAKDOWN);
  const [transactionsBreakdown, setTransactionsBreakdown] = useState(DEFAULT_TRANSACTION_BREAKDOWN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryData, bookingsData, transactionsData] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchBookings({ limit: 200 }),
        fetchTransactions({ limit: 100, sort: "-createdAt" }),
      ]);

      setSummary((prev) => ({
        ...prev,
        ...summaryData,
        revenueComparison: {
          ...prev.revenueComparison,
          ...(summaryData?.revenueComparison || {}),
        },
        revenueTrend: Array.isArray(summaryData?.revenueTrend)
          ? summaryData.revenueTrend
          : prev.revenueTrend,
      }));

      const bookings = Array.isArray(bookingsData) ? bookingsData : [];
      const bookingTally = bookings.reduce(
        (acc, booking) => {
          const key = normalizeBookingStatus(booking?.status);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { ...DEFAULT_BREAKDOWN }
      );
      setBookingsBreakdown(bookingTally);

      const transactions = Array.isArray(transactionsData) ? transactionsData : [];
      const transactionTally = transactions.reduce(
        (acc, transaction) => {
          const key = normalizeTransactionStatus(transaction?.status);
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { ...DEFAULT_TRANSACTION_BREAKDOWN }
      );
      setTransactionsBreakdown(transactionTally);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const insightCards = useMemo(
    () => [
      {
        label: "Today's Revenue",
        value: formatCurrency(summary.todayBookingAmount),
        helper: summary.revenueComparison?.target
          ? `${toPercent(summary.todayBookingAmount, summary.revenueComparison.target)} of target`
          : "Daily revenue captured",
      },
      {
        label: "Transactions",
        value: formatNumber(summary.totalTransactions),
        helper: "All-time processed transactions",
      },
      {
        label: "Registered Users",
        value: formatNumber(summary.totalUsers),
        helper: "Active guests and partners",
      },
      {
        label: "Listed Hotels",
        value: formatNumber(summary.totalHotels),
        helper: "Properties currently live",
      },
    ],
    [summary]
  );

  const totalBookings = useMemo(
    () =>
      Object.values(bookingsBreakdown).reduce((acc, count) => acc + (typeof count === "number" ? count : 0), 0),
    [bookingsBreakdown]
  );

  const totalTransactionsCount = useMemo(
    () =>
      Object.values(transactionsBreakdown).reduce((acc, count) => acc + (typeof count === "number" ? count : 0), 0),
    [transactionsBreakdown]
  );

  return (
    <div className="stats">
      <Sidebar />
      <div className="statsContainer">
        <Navbar />

        <header className="statsHeader surface-card">
          <div className="statsMeta">
            <span className="eyebrow">Intelligence · Performance</span>
            <h1>Operations pulse</h1>
            <p>Review portfolio momentum across bookings, transactions, and revenue performance.</p>
          </div>
          <div className="statsActions">
            <button type="button" className="primary-button" onClick={loadStats} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
        </header>

        {error && <div className="statsError">{error}</div>}

        <section className="insightGrid">
          {insightCards.map((card) => (
            <article key={card.label} className="insightCard surface-card">
              <span className="insightLabel">{card.label}</span>
              <span className="insightValue">{card.value}</span>
              <span className="insightHelper">{card.helper}</span>
            </article>
          ))}
        </section>

        <section className="statsPanels">
          <div className="panel surface-card">
            <Featured
              amount={summary.todayBookingAmount}
              loading={loading}
              comparison={summary.revenueComparison}
            />
          </div>
          <div className="panel surface-card">
            <Chart
              title="Last 6 Months (Revenue)"
              aspect={2 / 1}
              data={summary.revenueTrend}
              loading={loading}
            />
          </div>
        </section>

        <section className="breakdownRow">
          <article className="breakdownCard surface-card">
            <header>
              <h2>Bookings status</h2>
              <span>{formatNumber(totalBookings)} total</span>
            </header>
            <ul>
              {Object.entries(bookingsBreakdown).map(([status, count]) => (
                <li key={status}>
                  <div className="label">
                    <span className={`statusChip status-${status}`}>{status}</span>
                  </div>
                  <div className="value">
                    <span>{formatNumber(count)}</span>
                    <span className="percentage">{toPercent(count, totalBookings)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="breakdownCard surface-card">
            <header>
              <h2>Transactions status</h2>
              <span>{formatNumber(totalTransactionsCount)} total</span>
            </header>
            <ul>
              {Object.entries(transactionsBreakdown).map(([status, count]) => (
                <li key={status}>
                  <div className="label">
                    <span className={`statusChip status-${status}`}>{status}</span>
                  </div>
                  <div className="value">
                    <span>{formatNumber(count)}</span>
                    <span className="percentage">{toPercent(count, totalTransactionsCount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Stats;
