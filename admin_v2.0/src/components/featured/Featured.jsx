import MoreVertIcon from "@mui/icons-material/MoreVert";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Featured = ({ amount = 0, loading = false, comparison = {} }) => {
  const safeAmount = typeof amount === "number" ? amount : 0;
  const formattedAmount = safeAmount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });

  const targetValue = comparison.target || 1;
  const progressValue = Math.min(Math.max((safeAmount / targetValue) * 100, 0), 100);

  const metrics = [
    {
      title: "Target",
      value:
        comparison.target?.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }) || "—",
      isPositive: safeAmount >= (comparison.target || 0),
    },
    {
      title: "Yesterday",
      value:
        comparison.yesterday?.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }) || "—",
      isPositive: safeAmount >= (comparison.yesterday || 0),
    },
    {
      title: "Last Week",
      value:
        comparison.lastWeek?.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }) || "—",
      isPositive: safeAmount >= (comparison.lastWeek || 0),
    },
  ];

  return (
    <section className="surface-card flex flex-col gap-6 p-6 dark:border-dark-border dark:bg-dark-surface">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
            Today&apos;s booking revenue
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Live insights
          </p>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-primary/10 hover:text-primary"
        >
          <MoreVertIcon fontSize="small" />
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/60 bg-background/60 p-6 text-center shadow-soft dark:border-dark-border/60 dark:bg-dark-surface/60">
          <div className="h-40 w-40 max-w-full">
            <CircularProgressbar
              value={loading ? 0 : Number.isFinite(progressValue) ? progressValue : 0}
              text={loading ? "…" : `${Math.round(progressValue)}%`}
              strokeWidth={5}
              styles={{
                path: {
                  stroke: "var(--tw-prose-body, #2563eb)",
                },
                text: {
                  fill: "var(--tw-prose-bold, #0f172a)",
                  fontWeight: 600,
                },
              }}
            />
          </div>
          <p className="text-xs text-text-muted dark:text-dark-text-muted">Confirmed revenue collected today</p>
          <p className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            {loading ? "—" : formattedAmount}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <p className="text-sm leading-relaxed text-text-muted dark:text-dark-text-muted">
            Metrics refresh on booking confirmation. Pending or failed transactions are excluded from the totals.
          </p>
          <dl className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            {metrics.map((metric) => {
              const Icon = metric.isPositive ? TrendingUpIcon : TrendingDownIcon;
              return (
                <div
                  key={metric.title}
                  className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-4 shadow-soft dark:border-dark-border/70 dark:bg-dark-surface"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
                    {metric.title}
                  </dt>
                  <dd className="flex items-center gap-2 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        metric.isPositive ? "bg-green-100 text-success" : "bg-red-100 text-danger"
                      }`}
                    >
                      <Icon fontSize="inherit" />
                    </span>
                    <span className="min-w-0 break-words text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      {metric.value}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Featured;
