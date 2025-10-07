import "./chart.scss";
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

const Chart = ({ aspect, title, data = [], loading = false }) => {
  const series = normalizeSeries(data);
  const isPlaceholder = !data?.length;

  return (
    <div className="chart">
      <div className="title">{title}</div>
      <ResponsiveContainer width="100%" aspect={aspect}>
        <AreaChart
          width={730}
          height={250}
          data={series}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="gray" tick={{ fontSize: 12 }} />
          <CartesianGrid strokeDasharray="3 3" className="chartGrid" />
          <Tooltip
            formatter={(value) =>
              Number(value).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
              })
            }
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#4338ca"
            fillOpacity={1}
            fill="url(#total)"
            isAnimationActive={!loading && !isPlaceholder}
          />
        </AreaChart>
      </ResponsiveContainer>
      {loading && <div className="chart__status">Loading revenue trend…</div>}
      {!loading && isPlaceholder && (
        <div className="chart__status chart__status--muted">No revenue data for the last 6 months.</div>
      )}
    </div>
  );
};

export default Chart;
