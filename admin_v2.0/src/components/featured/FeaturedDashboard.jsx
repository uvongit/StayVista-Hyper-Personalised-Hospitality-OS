import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const formatCurrency = (value) =>
  typeof value === "number"
    ? value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      })
    : value ?? "—";

const FeaturedDashboard = ({ amount = 0, loading = false, comparison = {} }) => {
  const safeAmount = typeof amount === "number" ? amount : 0;
  const formattedAmount = formatCurrency(safeAmount);

  const targetValue = comparison.target || 1;
  const progressValue = Math.min(Math.max((safeAmount / targetValue) * 100, 0), 100);

  const metrics = [
    {
      title: "Target",
      value: formatCurrency(comparison.target),
      isPositive: safeAmount >= (comparison.target || 0),
    },
    {
      title: "Yesterday",
      value: formatCurrency(comparison.yesterday),
      isPositive: safeAmount >= (comparison.yesterday || 0),
    },
    {
      title: "Last Week",
      value: formatCurrency(comparison.lastWeek),
      isPositive: safeAmount >= (comparison.lastWeek || 0),
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary dark:bg-primary/20">
            Today
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              Booking revenue
            </h2>
            <p className="text-xs leading-relaxed text-text-muted dark:text-dark-text-muted">
              Confirmed settlements since midnight. Pending or failed transactions remain excluded.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] uppercase tracking-[0.3em] text-text-muted dark:text-dark-text-muted">
            Progress
          </span>
          <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
            {loading ? "—" : `${Math.round(progressValue)}%`}
          </p>
        </div>
      </header>

      <div className="flex items-start gap-6">
        <div className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl border border-border/50 bg-background/70 p-3 shadow-soft dark:border-dark-border/60 dark:bg-dark-surface/80">
          <CircularProgressbar
            value={loading ? 0 : Number.isFinite(progressValue) ? progressValue : 0}
            text={loading ? "…" : `${Math.round(progressValue)}%`}
            strokeWidth={6}
            styles={{
              path: { stroke: "var(--tw-prose-bold, #2563eb)" },
              trail: { stroke: "rgba(148, 163, 184, 0.2)" },
              text: { fill: "var(--tw-prose-bold, #1f2937)", fontWeight: 600, fontSize: "15px" },
            }}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.32em] text-text-muted dark:text-dark-text-muted">
              Confirmed today
            </p>
            <p className="text-3xl font-semibold tracking-tight text-text-primary dark:text-dark-text-primary">
              {loading ? "—" : formattedAmount}
            </p>
            <p className="text-xs leading-relaxed text-text-muted/90 dark:text-dark-text-muted/90">
              Last updated moments ago · Refresh from analytics for the latest capture.
            </p>
          </div>

          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
            {metrics.map(({ title, value, isPositive }) => {
              const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
              return (
                <div
                  key={title}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 shadow-soft dark:border-dark-border/70 dark:bg-dark-surface/80"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    <Icon fontSize="inherit" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-text-muted dark:text-dark-text-muted">
                      {title}
                    </p>
                    <p className="truncate text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                      {value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDashboard;
