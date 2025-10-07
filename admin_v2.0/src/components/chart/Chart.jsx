import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_SERIES = [
  { name: "Jan", total: 0 },
  { name: "Feb", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Apr", total: 0 },
  { name: "May", total: 0 },
  { name: "Jun", total: 0 },
];

const normalizeSeries = (series) => {
  if (!Array.isArray(series) || !series.length) {
    return DEFAULT_SERIES;
  }

  return series.map((point) => ({
    name: point?.name || point?.label || point?.month || "—",
    total: Number.isFinite(point?.total)
      ? point.total
      : Number.isFinite(point?.amount)
      ? point.amount
      : 0,
  }));
};

const Chart = ({ aspect = 2 / 1, title, data = [], loading = false }) => {
  const series = normalizeSeries(data);
  const isPlaceholder = !data?.length;

  return (
    <section className="surface-card flex flex-col gap-4 p-6 dark:border-dark-border dark:bg-dark-surface">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">{title}</h2>
      </header>
      <div className="h-full min-h-[260px]">
        <ResponsiveContainer width="100%" aspect={aspect}>
          <AreaChart
            data={series}
            margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <Tooltip
              cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
              formatter={(value) =>
                Number(value).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  minimumFractionDigits: 0,
                })
              }
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.2)",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.15)",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#chartTotal)"
              isAnimationActive={!loading && !isPlaceholder}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {loading && (
        <p className="text-center text-sm text-text-muted dark:text-dark-text-muted">
          Loading revenue trend…
        </p>
      )}
      {!loading && isPlaceholder && (
        <p className="text-center text-sm text-text-muted dark:text-dark-text-muted">
          No revenue data for the selected period.
        </p>
      )}
    </section>
  );
};

export default Chart;
