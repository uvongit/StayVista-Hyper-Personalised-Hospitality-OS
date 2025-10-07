import { useCallback, useEffect, useMemo, useState } from "react";
import Featured from "../../components/featured/Featured.jsx";
import Chart from "../../components/chart/Chart.jsx";
import { fetchAnalyticsSummary, fetchBookings, fetchTransactions } from "../../api/services.js";

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

const formatNumber = (value) => (typeof value === "number" ? value.toLocaleString("en-IN") : "—");

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

  const loadStats = useCallback(async () => {
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
      const bookingTally = bookings.reduce((acc, booking) => {
        const key = normalizeBookingStatus(booking?.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { ...DEFAULT_BREAKDOWN });
      setBookingsBreakdown(bookingTally);

      const transactions = Array.isArray(transactionsData) ? transactionsData : [];
      const transactionTally = transactions.reduce((acc, transaction) => {
        const key = normalizeTransactionStatus(transaction?.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { ...DEFAULT_TRANSACTION_BREAKDOWN });
      setTransactionsBreakdown(transactionTally);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load statistics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
      Object.values(bookingsBreakdown).reduce(
        (acc, count) => acc + (typeof count === "number" ? count : 0),
        0
      ),
    [bookingsBreakdown]
  );

  const totalTransactionsCount = useMemo(
    () =>
      Object.values(transactionsBreakdown).reduce(
        (acc, count) => acc + (typeof count === "number" ? count : 0),
        0
      ),
    [transactionsBreakdown]
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Intelligence · Performance
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            Operations pulse
          </h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Review portfolio momentum across bookings, transactions, and revenue performance.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
            onClick={loadStats}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh data"}
          </button>
          <span className="text-xs text-text-muted dark:text-dark-text-muted">
            Snapshot updates in near real time
          </span>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {insightCards.map((card) => (
          <article key={card.label} className="surface-card space-y-2 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted dark:text-dark-text-muted">
              {card.label}
            </span>
            <span className="block text-2xl font-semibold text-text-primary dark:text-dark-text-primary">
              {card.value}
            </span>
            <span className="block text-sm text-text-muted dark:text-dark-text-muted">{card.helper}</span>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <Featured amount={summary.todayBookingAmount} loading={loading} comparison={summary.revenueComparison} />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <Chart title="Last 6 Months (Revenue)" aspect={2 / 1} data={summary.revenueTrend} loading={loading} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Bookings status</h2>
            <span className="text-sm text-text-muted dark:text-dark-text-muted">{formatNumber(totalBookings)} total</span>
          </header>
          <ul className="space-y-3">
            {Object.entries(bookingsBreakdown).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between gap-4 text-sm">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
                  {status}
                </span>
                <div className="flex items-center gap-3 text-text-primary dark:text-dark-text-primary">
                  <span>{formatNumber(count)}</span>
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    {toPercent(count, totalBookings)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Transactions status</h2>
            <span className="text-sm text-text-muted dark:text-dark-text-muted">
              {formatNumber(totalTransactionsCount)} total
            </span>
          </header>
          <ul className="space-y-3">
            {Object.entries(transactionsBreakdown).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between gap-4 text-sm">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:bg-primary/20">
                  {status}
                </span>
                <div className="flex items-center gap-3 text-text-primary dark:text-dark-text-primary">
                  <span>{formatNumber(count)}</span>
                  <span className="text-xs text-text-muted dark:text-dark-text-muted">
                    {toPercent(count, totalTransactionsCount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default Stats;
