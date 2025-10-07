import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Widget from "../../components/widget/Widget.jsx";
import FeaturedDashboard from "../../components/featured/FeaturedDashboard.jsx";
import Chart from "../../components/chart/Chart.jsx";
import LatestTransactionsTable from "../../components/table/LatestTransactionsTable.jsx";
import { fetchAnalyticsSummary } from "../../api/services.js";

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

  const loadSummary = useCallback(async () => {
    let ignore = false;

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
        setError(err?.response?.data?.message || err?.message || "Unable to load analytics overview.");
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = loadSummary();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [loadSummary]);

  const widgets = useMemo(
    () => [
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
    ],
    [summary]
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Dashboard · Overview
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            Welcome back
          </h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Track portfolio health, monitor revenue momentum, and jump into frequently updated inventories.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary"
            onClick={() => loadSummary()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh insight"}
          </button>
          <Link
            to="/stats"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            View analytics
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {widgets.map((widget) => (
          <Widget
            key={widget.type}
            type={widget.type}
            value={widget.value}
            loading={loading}
            link={widget.link}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <FeaturedDashboard
            amount={summary.todayBookingAmount}
            loading={loading}
            comparison={summary.revenueComparison}
          />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <Chart
            title="Last 6 Months (Revenue)"
            aspect={2 / 1}
            data={summary.revenueTrend}
            loading={loading}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Quick actions</h2>
            <span className="text-xs text-text-muted dark:text-dark-text-muted">Shortcuts</span>
          </header>
          <ul className="mt-4 grid gap-3">
            {[{ label: "Add a new hotel", to: "/hotels/new" }, { label: "Create a room type", to: "/rooms/new" }, { label: "Invite a teammate", to: "/users/new" }].map((action) => (
              <li key={action.label}>
                <Link
                  to={action.to}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border/60 dark:text-dark-text-secondary"
                >
                  <span>{action.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">New to-dos</h2>
            <span className="text-xs text-text-muted dark:text-dark-text-muted">Operational feed</span>
          </header>
          <div className="mt-4 space-y-3 text-sm text-text-secondary dark:text-dark-text-secondary">
            <p>
              {loading
                ? "Loading updates…"
                : summary.totalHotels
                ? `You now manage ${summary.totalHotels.toLocaleString()} hotel${
                    summary.totalHotels === 1 ? "" : "s"
                  }. Ensure new rooms are linked to keep inventory synced.`
                : "No hotel data available yet. Create your first listing to get started."}
            </p>
            <p>
              {summary.totalTransactions
                ? `Transactions processed all-time: ${summary.totalTransactions.toLocaleString("en-IN")}.`
                : "Transactions data will appear here after your first booking comes through."}
            </p>
          </div>
        </article>
      </section>

      <section className="surface-card space-y-4 rounded-[10px] border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Latest Transactions
          </h2>
          <Link
            to="/transactions"
            className="text-sm font-medium text-primary transition hover:text-primary-dark"
          >
            View all
          </Link>
        </header>
        <LatestTransactionsTable />
      </section>
    </div>
  );
};

export default Home;
